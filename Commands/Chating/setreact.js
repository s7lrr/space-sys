
const Discord = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "setreact",

  run: async (client, message, args) => {
    if (!message.guild) return;

    if (!message.member.permissions.has("MANAGE_GUILD")) {
      return message.reply("❌ ما عندك صلاحية إدارة السيرفر.");
    }

    const channelId = args[0]?.replace(/[<#>]/g, "");
    const emojiInput = args[1];

    if (!channelId || !emojiInput) {
      return message.reply(
        "❌ الاستخدام الصحيح:\n" +
        "`+setreact ايدي_الشات الايموجي`\n\n" +
        "مثال:\n" +
        "`+setreact 123456789012345678 ❤️`"
      );
    }

    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== "GUILD_TEXT") {
      return message.reply("❌ آيدي الشات غير صحيح أو الشات ليس نصيًا.");
    }

    const permissions = channel.permissionsFor(client.user.id);

    if (
      !permissions ||
      !permissions.has([
        "VIEW_CHANNEL",
        "READ_MESSAGE_HISTORY",
        "ADD_REACTIONS"
      ])
    ) {
      return message.reply(
        "❌ البوت يحتاج صلاحيات مشاهدة الشات وقراءة الرسائل وإضافة الرياكشنات."
      );
    }

    let emoji = emojiInput;

    // دعم الإيموجيات المخصصة الثابتة والمتحركة
    const customEmoji = emojiInput.match(
      /^<a?:([a-zA-Z0-9_]+):(\d+)>$/
    );

    if (customEmoji) {
      const emojiId = customEmoji[2];
      const foundEmoji = client.emojis.cache.get(emojiId);

      if (!foundEmoji) {
        return message.reply(
          "❌ البوت ما يقدر يوصل لهذا الإيموجي.\n" +
          "تأكد أن البوت موجود في السيرفر اللي فيه الإيموجي."
        );
      }

      if (
        foundEmoji.guild.id !== message.guild.id &&
        !permissions.has("USE_EXTERNAL_EMOJIS")
      ) {
        return message.reply(
          "❌ البوت يحتاج صلاحية Use External Emojis لاستخدام إيموجي من سيرفر ثاني."
        );
      }

      emoji = emojiId;
    }

    const key = `auto_react_${message.guild.id}_${channel.id}`;

    db.set(key, emoji);

    const embed = new Discord.MessageEmbed()
      .setColor("#B99568")
      .setTitle("✅ تم تفعيل الرياكشن التلقائي")
      .setDescription(
        `**الشات:** ${channel}\n` +
        `**الرياكشن:** ${emojiInput}\n\n` +
        "سيتم وضع الرياكشن على كل رسالة جديدة في هذا الشات."
      )
      .setFooter({ text: "Auto Reaction System" });

    return message.reply({ embeds: [embed] });
  }
};
