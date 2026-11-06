
const Discord = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "unreact",

  run: async (client, message, args) => {
    if (!message.guild) return;

    if (!message.member.permissions.has("MANAGE_GUILD")) {
      return message.reply("❌ ما عندك صلاحية إدارة السيرفر.");
    }

    const channelId = args[0]?.replace(/[<#>]/g, "");

    if (!channelId) {
      return message.reply(
        "❌ الاستخدام الصحيح:\n" +
        "`+unreact ايدي_الشات`"
      );
    }

    const channel = message.guild.channels.cache.get(channelId);

    if (!channel || channel.type !== "GUILD_TEXT") {
      return message.reply("❌ آيدي الشات غير صحيح.");
    }

    const key = `auto_react_${message.guild.id}_${channel.id}`;

    if (!db.get(key)) {
      return message.reply(
        "❌ ما فيه رياكشن تلقائي مفعل في هذا الشات."
      );
    }

    db.delete(key);

    const embed = new Discord.MessageEmbed()
      .setColor("#B99568")
      .setTitle("✅ تم إلغاء الرياكشن التلقائي")
      .setDescription(
        `**الشات:** ${channel}\n\n` +
        "لن يتم وضع رياكشنات تلقائية على الرسائل الجديدة."
      );

    return message.reply({ embeds: [embed] });
  }
};
