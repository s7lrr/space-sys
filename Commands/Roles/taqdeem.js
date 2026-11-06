
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu
} = require("discord.js");

const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

function settingsKey(guildId) {
  return `privateRoleApplySettings_${guildId}`;
}

function getSettings(guildId) {
  return db.get(settingsKey(guildId)) || {
    channelId: null,
    senderRoles: [],
    reviewerRoles: []
  };
}

function saveSettings(guildId, settings) {
  db.set(settingsKey(guildId), settings);
}

function hasRole(member, roleIds) {
  return roleIds.some(id => member.roles.cache.has(id));
}

function createEmbed(guild, target) {
  return new MessageEmbed()
    .setColor("#9B59B6")
    .setAuthor({
      name: "نظام التقديم | الرولات الخاصة",
      iconURL: guild.iconURL({ dynamic: true }) || undefined
    })
    .setTitle("✦ بوابة التقديم")
    .setDescription(
      `أهلًا بك <@${target.id}>!\n\n` +
      `يمكنك تقديم طلب للحصول على رول خاص بك داخل السيرفر.\n\n` +
      `**طريقة التقديم:**\n` +
      `اختر نوع الطلب من القائمة الموجودة بالأسفل، ` +
      `ثم عبّئ النموذج وأرسل طلبك للإدارة.\n\n` +
      `**✧ طلب رول خاص**\n` +
      `• اسم الرول\n` +
      `• اللون الأساسي\n` +
      `• اللون الثاني (اختياري)\n\n` +
      `> سيتم مراجعة طلبك وإبلاغك بالنتيجة.`
    )
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: "نظام الرولات الخاصة • إدارة الطلبات"
    })
    .setTimestamp();
}

module.exports = {
  name: "تقديم",
  aliases: ["taqdeem", "apply"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const settings = getSettings(guildId);

    settings.senderRoles = Array.isArray(settings.senderRoles)
      ? settings.senderRoles
      : [];

    settings.reviewerRoles = Array.isArray(settings.reviewerRoles)
      ? settings.reviewerRoles
      : [];

    const isAdmin = message.member.permissions.has("ADMINISTRATOR");

    const sub = args[0];

    // تحديد روم استقبال الطلبات
    if (sub === "روم") {
      if (!isAdmin) {
        return message.reply("❌ هذا الإعداد للإدارة فقط.");
      }

      const channel = message.mentions.channels.first();

      if (!channel || channel.type !== "GUILD_TEXT") {
        return message.reply(
          `❌ الاستخدام: \`${prefix}تقديم روم #الروم\``
        );
      }

      settings.channelId = channel.id;
      saveSettings(guildId, settings);

      return message.reply(
        `✅ تم تحديد روم الطلبات: ${channel}`
      );
    }

    // إضافة أو إزالة رتب مسؤولي التقديم
    if (sub === "مسؤول") {
      if (!isAdmin) {
        return message.reply("❌ هذا الإعداد للإدارة فقط.");
      }

      const action = args[1];
      const role = message.mentions.roles.first();

      if (!role || !["إضافة", "إزالة"].includes(action)) {
        return message.reply(
          `❌ الاستخدام:\n` +
          `\`${prefix}تقديم مسؤول إضافة @رتبة\`\n` +
          `\`${prefix}تقديم مسؤول إزالة @رتبة\``
        );
      }

      if (action === "إضافة") {
        if (!settings.senderRoles.includes(role.id)) {
          settings.senderRoles.push(role.id);
        }
      } else {
        settings.senderRoles = settings.senderRoles.filter(
          id => id !== role.id
        );
      }

      saveSettings(guildId, settings);

      return message.reply(
        `✅ تم ${action === "إضافة" ? "إضافة" : "إزالة"} ` +
        `رتبة ${role} ${action === "إضافة" ? "إلى" : "من"} مسؤولي التقديم.`
      );
    }

    // إضافة أو إزالة رتب مراجعي الطلبات
    if (sub === "مراجعة") {
      if (!isAdmin) {
        return message.reply("❌ هذا الإعداد للإدارة فقط.");
      }

      const action = args[1];
      const role = message.mentions.roles.first();

      if (!role || !["إضافة", "إزالة"].includes(action)) {
        return message.reply(
          `❌ الاستخدام:\n` +
          `\`${prefix}تقديم مراجعة إضافة @رتبة\`\n` +
          `\`${prefix}تقديم مراجعة إزالة @رتبة\``
        );
      }

      if (action === "إضافة") {
        if (!settings.reviewerRoles.includes(role.id)) {
          settings.reviewerRoles.push(role.id);
        }
      } else {
        settings.reviewerRoles = settings.reviewerRoles.filter(
          id => id !== role.id
        );
      }

      saveSettings(guildId, settings);

      return message.reply(
        `✅ تم ${action === "إضافة" ? "إضافة" : "إزالة"} ` +
        `رتبة ${role} ${action === "إضافة" ? "إلى" : "من"} مراجعي الطلبات.`
      );
    }

    // عرض الإعدادات
    if (sub === "إعدادات") {
      if (!isAdmin) {
        return message.reply("❌ هذا الإعداد للإدارة فقط.");
      }

      const embed = new MessageEmbed()
        .setColor("#5865F2")
        .setTitle("⚙️ إعدادات نظام التقديم")
        .addFields(
          {
            name: "📨 روم استقبال الطلبات",
            value: settings.channelId
              ? `<#${settings.channelId}>`
              : "لم يتم تحديده"
          },
          {
            name: "👑 مسؤولو إرسال التقديم",
            value: settings.senderRoles.length
              ? settings.senderRoles.map(id => `<@&${id}>`).join("\n")
              : "الإدارة فقط"
          },
          {
            name: "🛡️ مسؤولو قبول ورفض الطلبات",
            value: settings.reviewerRoles.length
              ? settings.reviewerRoles.map(id => `<@&${id}>`).join("\n")
              : "الإدارة فقط"
          }
        );

      return message.reply({
        embeds: [embed],
        allowedMentions: { parse: [] }
      });
    }

    // التحقق من صلاحية إرسال التقديم
    const canSend =
      isAdmin ||
      hasRole(message.member, settings.senderRoles);

    if (!canSend) {
      return message.reply(
        "❌ هذا الأمر مخصص للإدارة ومسؤولي التقديم فقط."
      );
    }

    if (!settings.channelId) {
      return message.reply(
        `❌ لازم تحدد روم الطلبات أولًا:\n` +
        `\`${prefix}تقديم روم #الروم\``
      );
    }

    const target =
      message.mentions.members.first() ||
      (args[0] && /^\d{17,20}$/.test(args[0])
        ? await message.guild.members.fetch(args[0]).catch(() => null)
        : null);

    if (!target) {
      return message.reply(
        `❌ الاستخدام: \`${prefix}تقديم @عضو\``
      );
    }

    if (target.user.bot) {
      return message.reply("❌ ما تقدر ترسل تقديم لبوت.");
    }

    const menu = new MessageSelectMenu()
      .setCustomId(`private_apply_menu:${target.id}`)
      .setPlaceholder("✦ اختر نوع الطلب من هنا")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "طلب رول خاص",
          description: "تقديم طلب لإنشاء رول خاص باسم ولون تختاره",
          value: "private_role",
          emoji: ""
        }

        // أضف خيارات جديدة هنا مستقبلًا
      ]);

    const row = new MessageActionRow().addComponents(menu);

    return message.channel.send({
      content: `<@${target.id}>`,
      embeds: [createEmbed(message.guild, target.user)],
      components: [row]
    });
  }
};
