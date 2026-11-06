
const { MessageEmbed } = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "checkroles",
  aliases: ["فحص_الرولات"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply({
        content: "❌ الأمر للإدارة فقط."
      });
    }

    try {
      const allData = db.all();
      const results = [];

      // دعم صيغ البيانات المختلفة
      const entries = Array.isArray(allData)
        ? allData.map(item => {
            if (!item || typeof item !== "object") {
              return null;
            }

            return [
              item.id || item.ID || item.key,
              item.value !== undefined
                ? item.value
                : item.data
            ];
          })
        : Object.entries(allData || {});

      for (const entry of entries) {
        if (!entry) continue;

        const [key, value] = entry;

        if (typeof key !== "string") continue;
        if (!key.startsWith("userRoles_")) continue;

        const userId = key.slice("userRoles_".length);

        if (!/^\d+$/.test(userId)) continue;
        if (!Array.isArray(value)) continue;

        for (const roleId of value) {
          if (!roleId) continue;

          const role = message.guild.roles.cache.get(
            String(roleId)
          );

          if (!role) {
            results.push(
              `👤 **صاحب الرول:** <@${userId}>\n` +
              `🆔 **آيدي العضو:** \`${userId}\`\n` +
              `❌ **آيدي الرول المفقود:** \`${roleId}\``
            );
          }
        }
      }

      if (!results.length) {
        return message.reply({
          content:
            "✅ ما لقيت رولات خاصة مفقودة في البيانات، أو ما فيه سجلات قابلة للفحص."
        });
      }

      // تقسيم النتائج حتى لا يتجاوز الإمبد الحد
      const pages = [];

      for (let i = 0; i < results.length; i += 5) {
        pages.push(
          results.slice(i, i + 5).join("\n\n")
        );
      }

      for (let i = 0; i < pages.length; i++) {
        const embed = new MessageEmbed()
          .setColor("RED")
          .setTitle("🔍 الرولات الخاصة المفقودة")
          .setDescription(pages[i])
          .setFooter({
            text: `صفحة ${i + 1} / ${pages.length}`
          });

        await message.channel.send({
          embeds: [embed],
          allowedMentions: {
            parse: []
          }
        });
      }

    } catch (error) {
      console.error("CheckRoles Error:", error);

      return message.reply({
        content: "❌ حدث خطأ أثناء فحص بيانات الرولات."
      }).catch(() => {});
    }
  }
};
