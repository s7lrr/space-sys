
const { MessageEmbed } = require("discord.js");
const Pro = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "dsrole",

  run: async (client, message) => {
    if (!message.guild || message.author.bot) return;

    const Color =
      Pro.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowDb = Pro.get(
      `Allow - Command srole = [ ${message.guild.id} ]`
    );

    const allowedRole = message.guild.roles.cache.get(
      String(allowDb || "")
    );

    const isAuthorAllowed = allowedRole
      ? message.member.roles.cache.has(allowedRole.id)
      : false;

    if (
      !isAuthorAllowed &&
      message.author.id !== allowDb &&
      !message.member.permissions.has("MANAGE_ROLES")
    ) {
      return;
    }

    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(Color)
            .setDescription(
              `**طريقة الاستخدام:** \`${prefix}dsrole @عضو\``
            )
        ]
      });
    }

    const userId = mentionedUser.id;
    const roleKey = `userRoles_${userId}`;

    const userRoles = Pro.get(roleKey) || [];

    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return message.reply("❌ العضو ما عنده رول خاص.");
    }

    const botMember = message.guild.me;

    if (
      !botMember ||
      !botMember.permissions.has("MANAGE_ROLES")
    ) {
      return message.reply(
        "❌ البوت يحتاج صلاحية Manage Roles."
      );
    }

    let deletedCount = 0;
    const failedRoles = [];

    for (const roleId of userRoles) {
      const role = message.guild.roles.cache.get(
        String(roleId)
      );

      // الرول محذوف مسبقًا، فلا نحتفظ ببياناته
      if (!role) continue;

      if (
        role.managed ||
        role.id === message.guild.id ||
        role.position >= botMember.roles.highest.position
      ) {
        failedRoles.push(String(roleId));
        continue;
      }

      try {
        // حذف الرول نهائيًا من السيرفر
        await role.delete(
          `Private role deleted by ${message.author.tag}`
        );

        deletedCount++;
      } catch (error) {
        console.error("DSROLE DELETE ERROR:", error);
        failedRoles.push(String(roleId));
      }
    }

    // تحديث قاعدة البيانات بعد محاولة حذف الرولات
    if (failedRoles.length === 0) {
      // حذف سجل الرولات الخاصة للعضو بالكامل
      Pro.delete(roleKey);
    } else {
      // الاحتفاظ فقط بالرولات التي لم تُحذف
      Pro.set(roleKey, failedRoles);
    }

    // تنظيف إحصائيات التوب إذا لم يتبقَّ رول خاص
    if (failedRoles.length === 0) {
      const statsKey = `top_stats_${message.guild.id}`;
      const stats = Pro.get(statsKey) || {};

      if (
        stats &&
        typeof stats === "object" &&
        !Array.isArray(stats) &&
        Object.prototype.hasOwnProperty.call(stats, userId)
      ) {
        delete stats[userId];
        Pro.set(statsKey, stats);
      }
    }

    if (failedRoles.length > 0) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor("RED")
            .setTitle("نتيجة حذف الرول الخاص")
            .setDescription(
              `✅ تم حذف **${deletedCount}** رول من السيرفر.\n` +
              `❌ تعذر حذف **${failedRoles.length}** رول.\n\n` +
              `تم تنظيف البيانات الخاصة بالرولات المحذوفة، ` +
              `والاحتفاظ ببيانات الرولات التي فشل حذفها.`
            )
        ]
      });
    }

    await message.react("✅").catch(() => {});

    return message.reply({
      embeds: [
        new MessageEmbed()
          .setColor(Color)
          .setTitle("✅ تم حذف الرول الخاص")
          .setDescription(
            `**العضو:** <@${userId}>\n` +
            `**الرولات المحذوفة:** ${deletedCount}\n\n` +
            `✅ تم حذف الرول من السيرفر.\n` +
            `✅ تم حذف بياناته من قاعدة البيانات.\n` +
            `✅ تم حذف إحصائياته من التوب.`
          )
      ],
      allowedMentions: {
        parse: []
      }
    });
  }
};
