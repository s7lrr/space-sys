
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageButton
} = require("discord.js");

const db = require("pro.db");

const activeUsers = new Set();

function isHex(value) {
  return /^#?[0-9a-fA-F]{6}$/.test(value || "");
}

function formatHex(value) {
  return "#" + value.replace("#", "").toUpperCase();
}

function colorNumber(value) {
  return parseInt(value.replace("#", ""), 16);
}

async function waitForReply(message, userId) {
  const collected = await message.channel.awaitMessages({
    filter: m => m.author.id === userId && !m.author.bot,
    max: 1,
    time: 60000
  });

  return collected.first();
}

async function setColors(client, guild, role, first, second) {
  if (second === null) {
    await client.api.guilds(guild.id).roles(role.id).patch({
      data: {
        color: colorNumber(first),
        colors: {
          primary_color: colorNumber(first),
          secondary_color: null,
          tertiary_color: null
        }
      }
    });
  } else {
    await client.api.guilds(guild.id).roles(role.id).patch({
      data: {
        colors: {
          primary_color: colorNumber(first),
          secondary_color: colorNumber(second),
          tertiary_color: null
        }
      }
    });
  }
}

module.exports = {
  name: "myrole",
  aliases: ["رولي"],

  run: async (client, message) => {
    if (!message.guild || message.author.bot) return;

    const userId = message.author.id;
    const sessionKey = `${message.guild.id}:${userId}`;

    if (activeUsers.has(sessionKey)) {
      return message.reply("❌ عندك قائمة مفتوحة بالفعل.");
    }

    const userRoles = db.get(`userRoles_${userId}`);

    if (!Array.isArray(userRoles) || !userRoles.length) {
      return message.reply("❌ ما عندك رول خاص.");
    }

    const roles = userRoles
      .map(id => message.guild.roles.cache.get(id))
      .filter(Boolean);

    if (!roles.length) {
      return message.reply("❌ ما لقيت رولك الخاص.");
    }

    activeUsers.add(sessionKey);

    const menu = new MessageSelectMenu()
      .setCustomId("myrole_options")
      .setPlaceholder("اختر التعديل المطلوب")
      .addOptions([
        {
          label: "اسم الرول",
          description: "تغيير اسم رولك",
          value: "roleName",
          emoji: "✏️"
        },
        {
          label: "لون الرول",
          description: "لون واحد أو لونين",
          value: "roleColor",
          emoji: ""
        },
        {
          label: "صورة الرول",
          description: "تغيير صورة الرول",
          value: "roleImage",
          emoji: "🖼️"
        },
        {
          label: "مشاركة الرول",
          description: "إعطاء رولك لشخص",
          value: "giveMyRole",
          emoji: "👥"
        },
        {
          label: "إزالة مشاركة",
          description: "إزالة رولك من شخص",
          value: "removeRole",
          emoji: "➖"
        },
        {
          label: "حذف الرول",
          description: "حذف رولك الخاص",
          value: "deleteRole",
          emoji: "🗑️"
        }
      ]);

    const cancel = new MessageButton()
      .setCustomId("myrole_cancel")
      .setLabel("إلغاء")
      .setStyle("SECONDARY");

    const row = new MessageActionRow().addComponents(menu);
    const buttonRow = new MessageActionRow().addComponents(cancel);

    let menuMessage;

    try {
      menuMessage = await message.reply({
        content:
          "**رولك الخاص**\n" +
          roles.map(r => r.toString()).join(" "),
        components: [row, buttonRow]
      });

      const collector = menuMessage.createMessageComponentCollector({
        filter: i =>
          i.user.id === userId &&
          ["myrole_options", "myrole_cancel"].includes(i.customId),
        max: 1,
        time: 60000
      });

      collector.on("collect", async interaction => {
        try {
          if (interaction.customId === "myrole_cancel") {
            await interaction.deferUpdate();
            await menuMessage.delete().catch(() => {});
            return;
          }

          await interaction.deferUpdate();

          await menuMessage.edit({
            components: []
          }).catch(() => {});

          const ask = async text => {
            await interaction.followUp({
              content: text,
              ephemeral: true
            });

            const response = await waitForReply(message, userId);

            if (!response) {
              throw new Error("انتهى الوقت.");
            }

            await response.delete().catch(() => {});
            return response;
          };

          const apply = async callback => {
            let success = 0;

            for (const role of roles) {
              if (!role.editable) continue;

              try {
                await callback(role);
                success++;
              } catch (error) {
                console.error("MyRole:", error);
              }
            }

            if (!success) {
              throw new Error(
                "ما قدرت أعدل الرول. تأكد من صلاحيات البوت."
              );
            }
          };

          const selected = interaction.values[0];

          if (selected === "roleColor") {
            const firstMsg = await ask(
              " **اللون الأول**\n" +
              "أرسل كود اللون مثل: `#FF0000`"
            );

            const first = firstMsg.content.trim();

            if (!isHex(first)) {
              throw new Error("كود اللون الأول غير صحيح.");
            }

            const secondMsg = await ask(
              " **اللون الثاني**\n" +
              `الأول: \`${formatHex(first)}\`\n` +
              "أرسل اللون الثاني أو اكتب `بدون`."
            );

            const second = secondMsg.content.trim();

            const without =
              second === "بدون" ||
              second.toLowerCase() === "none";

            if (!without && !isHex(second)) {
              throw new Error("كود اللون الثاني غير صحيح.");
            }

            await apply(role =>
              setColors(
                client,
                message.guild,
                role,
                first,
                without ? null : second
              )
            );

            await interaction.followUp({
              content: without
                ? `✅ **تم تغيير لون رولك**\nاللون: \`${formatHex(first)}\``
                : `✅ **تم تغيير لون رولك**\nالأول: \`${formatHex(first)}\`\nالثاني: \`${formatHex(second)}\``,
              ephemeral: true
            });
          }

          else if (selected === "roleName") {
            const response = await ask(
              "✏️ **اسم الرول**\nأرسل الاسم الجديد."
            );

            const name = response.content.trim();

            if (!name || name.length > 100) {
              throw new Error("اسم الرول غير صحيح.");
            }

            await apply(role => role.setName(name));

            await interaction.followUp({
              content: `✅ **تم تغيير اسم رولك**\n${name}`,
              ephemeral: true
            });
          }

          else if (selected === "roleImage") {
            const response = await ask(
              "🖼️ **صورة الرول**\nأرسل صورة أو إيموجي مخصص."
            );

            let imageUrl;
            const emoji = response.content.match(
              /^<a?:\w+:(\d+)>$/
            );

            if (emoji) {
              imageUrl =
                `https://cdn.discordapp.com/emojis/${emoji[1]}.png`;
            } else if (response.attachments.size) {
              imageUrl = response.attachments.first().url;
            } else {
              throw new Error("أرسل صورة أو إيموجي صحيح.");
            }

            await apply(role => role.setIcon(imageUrl));

            await interaction.followUp({
              content: "✅ **تم تغيير صورة رولك**",
              ephemeral: true
            });
          }

          else if (selected === "giveMyRole") {
            const response = await ask(
              "👥 **مشاركة الرول**\nمنشن الشخص."
            );

            const user = response.mentions.users.first();

            if (!user) {
              throw new Error("المنشن غير صحيح.");
            }

            const member = await message.guild.members
              .fetch(user.id)
              .catch(() => null);

            if (!member) {
              throw new Error("الشخص غير موجود.");
            }

            await apply(role => member.roles.add(role));

            await interaction.followUp({
              content: `✅ **تمت مشاركة رولك مع ${user}**`,
              ephemeral: true
            });
          }

          else if (selected === "removeRole") {
            const response = await ask(
              "➖ **إزالة مشاركة**\nمنشن الشخص."
            );

            const user = response.mentions.users.first();

            if (!user) {
              throw new Error("المنشن غير صحيح.");
            }

            const member = await message.guild.members
              .fetch(user.id)
              .catch(() => null);

            if (!member) {
              throw new Error("الشخص غير موجود.");
            }

            await apply(role => member.roles.remove(role));

            await interaction.followUp({
              content: `✅ **تمت إزالة الرول من ${user}**`,
              ephemeral: true
            });
          }

          else if (selected === "deleteRole") {
            await apply(role =>
              role.delete("Deleted by role owner")
            );

            db.delete(`userRoles_${userId}`);

            await interaction.followUp({
              content: "✅ **تم حذف رولك الخاص**",
              ephemeral: true
            });
          }

          await menuMessage.delete().catch(() => {});

        } catch (error) {
          console.error("MyRole Error:", error);

          await interaction.followUp({
            content: `❌ **${error.message}**`,
            ephemeral: true
          }).catch(() => {});

          await menuMessage.delete().catch(() => {});

        } finally {
          activeUsers.delete(sessionKey);
        }
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          activeUsers.delete(sessionKey);
          await menuMessage.delete().catch(() => {});
        }
      });

    } catch (error) {
      console.error(error);
      activeUsers.delete(sessionKey);
    }
  }
};
