
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton
} = require("discord.js");

const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

const activeUsers = new Set();

function replyEmbed(message, color, description) {
  return message.reply({
    embeds: [
      new MessageEmbed()
        .setColor(color)
        .setDescription(description)
    ]
  });
}

function isHex(value) {
  return /^#?[0-9a-fA-F]{6}$/.test(value || "");
}

function formatHex(value) {
  return "#" + value.replace("#", "").toUpperCase();
}

function colorNumber(value) {
  return parseInt(value.replace("#", ""), 16);
}

function findRole(guild, value) {
  if (!value) return null;

  const mention = value.match(/^<@&(\d+)>$/);
  const id = mention ? mention[1] : value;

  return (
    guild.roles.cache.get(id) ||
    guild.roles.cache.find(
      r => r.name.toLowerCase() === value.toLowerCase()
    )
  );
}

async function waitForReply(message) {
  const collected = await message.channel.awaitMessages({
    filter: m =>
      m.author.id === message.author.id &&
      !m.author.bot,
    max: 1,
    time: 60000
  });

  return collected.first();
}

module.exports = {
  name: "editrole",
  aliases: ["editrol", "er"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    const guildColor =
      db.get(`Guild_Color = ${message.guild.id}`) ||
      message.guild.me?.displayHexColor ||
      "#000000";

    const allowDb = db.get(
      `Allow - Command editrole = [ ${message.guild.id} ]`
    );

    const allowedRole = message.guild.roles.cache.get(allowDb);

    const isAllowed =
      (allowedRole &&
        message.member.roles.cache.has(allowedRole.id)) ||
      message.author.id === allowDb ||
      message.member.permissions.has("MANAGE_ROLES");

    if (!isAllowed) {
      return replyEmbed(
        message,
        guildColor,
        "❌ **ما عندك صلاحية استخدام الأمر.**"
      );
    }

    // قائمة المساعدة
    if (!args.length) {
      const embed = new MessageEmbed()
        .setColor(guildColor)
        .setTitle("✏️ تعديل الرول")
        .setDescription(
          `**تغيير الاسم**\n` +
          `\`${prefix}er @Role name NewName\`\n\n` +
          `**تغيير اللون**\n` +
          `\`${prefix}er @Role color\``
        );

      return message.reply({ embeds: [embed] });
    }

    const role = findRole(message.guild, args[0]);

    if (!role) {
      return replyEmbed(
        message,
        "RED",
        "❌ **الرول غير موجود.**"
      );
    }

    if (
      role.id === message.guild.id ||
      role.managed ||
      !role.editable
    ) {
      return replyEmbed(
        message,
        "RED",
        "❌ **ما أقدر أعدل هذا الرول.**"
      );
    }

    // تغيير اسم الرول
    if (
      args.length > 1 &&
      !["color", "colors", "لون"].includes(
        args[1].toLowerCase()
      )
    ) {
      const name =
        args[1].toLowerCase() === "name"
          ? args.slice(2).join(" ").trim()
          : args.slice(1).join(" ").trim();

      if (!name || name.length > 100) {
        return replyEmbed(
          message,
          "RED",
          "❌ **اسم الرول غير صحيح.**"
        );
      }

      try {
        await role.setName(name);

        return replyEmbed(
          message,
          "GREEN",
          `✅ **تم تغيير اسم الرول**\n${name}`
        );
      } catch (error) {
        console.error("EditRole Name Error:", error);

        return replyEmbed(
          message,
          "RED",
          "❌ **فشل تغيير الاسم.**"
        );
      }
    }

    // تعديل لون الرول
    const sessionKey =
      `${message.guild.id}:${message.channel.id}:${message.author.id}`;

    if (activeUsers.has(sessionKey)) {
      return replyEmbed(
        message,
        "RED",
        "❌ **عندك تعديل شغال بالفعل.**"
      );
    }

    activeUsers.add(sessionKey);

    const button = new MessageButton()
      .setCustomId("editrole_color_start")
      .setLabel("تعديل اللون")
      .setEmoji("")
      .setStyle("PRIMARY");

    const row = new MessageActionRow()
      .addComponents(button);

    let buttonMessage;

    try {
      buttonMessage = await message.reply({
        content: ` **تعديل لون ${role.name}**`,
        components: [row]
      });

      const collector =
        buttonMessage.createMessageComponentCollector({
          filter: i =>
            i.user.id === message.author.id &&
            i.customId === "editrole_color_start",
          max: 1,
          time: 60000
        });

      collector.on("collect", async interaction => {
        try {
          await interaction.deferUpdate();

          await buttonMessage.edit({
            components: []
          }).catch(() => {});

          const ask = async text => {
            await interaction.followUp({
              content: text,
              ephemeral: true
            });

            const response = await waitForReply(message);

            if (!response) {
              throw new Error("انتهى الوقت.");
            }

            await response.delete().catch(() => {});
            return response;
          };

          // اللون الأول
          const firstMsg = await ask(
            ` **اللون الأول لـ ${role.name}**\n` +
            "أرسل كود اللون مثل: `#FF0000`"
          );

          const first = firstMsg.content.trim();

          if (!isHex(first)) {
            throw new Error("كود اللون الأول غير صحيح.");
          }

          // اللون الثاني
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

          // تطبيق اللون أو Gradient
          await client.api
            .guilds(message.guild.id)
            .roles(role.id)
            .patch({
              data: {
                color: colorNumber(first),
                colors: {
                  primary_color: colorNumber(first),
                  secondary_color: without
                    ? null
                    : colorNumber(second),
                  tertiary_color: null
                }
              }
            });

          await interaction.followUp({
            content: without
              ? `✅ **تم تغيير لون ${role.name}**\n` +
                `اللون: \`${formatHex(first)}\``
              : `✅ **تم تغيير لون ${role.name}**\n` +
                `الأول: \`${formatHex(first)}\`\n` +
                `الثاني: \`${formatHex(second)}\``,
            ephemeral: true
          });

          await buttonMessage.delete().catch(() => {});

        } catch (error) {
          console.error("EditRole Error:", error);

          await interaction.followUp({
            content: "❌ **تعذر تغيير لون الرول.**",
            ephemeral: true
          }).catch(() => {});

          await buttonMessage.delete().catch(() => {});

        } finally {
          activeUsers.delete(sessionKey);
        }
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          activeUsers.delete(sessionKey);
          await buttonMessage.delete().catch(() => {});
        }
      });

    } catch (error) {
      console.error("EditRole Button Error:", error);
      activeUsers.delete(sessionKey);
    }
  }
};
