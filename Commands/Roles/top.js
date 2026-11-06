
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton
} = require("discord.js");

const db = require("pro.db");

const PAGE_SIZE = 10;

// جلب إحصائيات التوب
function getStats(guildId) {
  const stats = db.get(`top_stats_${guildId}`);

  if (
    !stats ||
    typeof stats !== "object" ||
    Array.isArray(stats)
  ) {
    return {};
  }

  return stats;
}

// قراءة مفاتيح قاعدة البيانات بأكثر من صيغة
function getDatabaseKeys() {
  const keys = new Set();

  let allData;

  try {
    allData = db.all();
  } catch (error) {
    console.error("TOP DB ALL ERROR:", error);
    return [];
  }

  if (Array.isArray(allData)) {
    for (const item of allData) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const key =
        item.id ??
        item.ID ??
        item.key ??
        item.name;

      if (typeof key === "string") {
        keys.add(key);
      }

      // بعض إصدارات قاعدة البيانات ترجع
      // البيانات داخل object
      if (item.data && typeof item.data === "object") {
        for (const nestedKey of Object.keys(item.data)) {
          keys.add(nestedKey);
        }
      }
    }
  } else if (
    allData &&
    typeof allData === "object"
  ) {
    for (const key of Object.keys(allData)) {
      keys.add(key);
    }
  }

  return [...keys];
}

// جلب الرولات الخاصة المسجلة في الداتا بيس
function getPrivateRoles(guild) {
  const users = new Map();

  const keys = getDatabaseKeys();

  // إضافة أصحاب الإحصائيات كاحتمال إضافي
  // ثم التحقق من رولهم باستخدام db.get
  const stats = getStats(guild.id);

  for (const userId of Object.keys(stats)) {
    if (/^\d+$/.test(userId)) {
      keys.push(`userRoles_${userId}`);
    }
  }

  // فحص المفاتيح بدون تكرار
  const uniqueKeys = [...new Set(keys)];

  for (const key of uniqueKeys) {
    if (typeof key !== "string") continue;

    if (!key.startsWith("userRoles_")) {
      continue;
    }

    const userId = key.slice("userRoles_".length);

    if (!/^\d+$/.test(userId)) {
      continue;
    }

    // نفس طريقة أمر myrole
    const storedRoles = db.get(
      `userRoles_${userId}`
    );

    if (
      !Array.isArray(storedRoles) ||
      storedRoles.length === 0
    ) {
      continue;
    }

    // جلب الرولات الموجودة فعليًا في السيرفر
    const validRoles = [];

    for (const roleId of storedRoles) {
      const role = guild.roles.cache.get(
        String(roleId)
      );

      if (!role) continue;

      // تجاهل الرول الافتراضي
      if (role.id === guild.id) continue;

      // تجاهل أي رول اسمه لا يوجد رول
      const roleName = role.name.trim();

      if (
        !roleName ||
        roleName === "لا يوجد رول" ||
        roleName === "لا يوجد رول خاص"
      ) {
        continue;
      }

      // منع تكرار الرول
      if (
        !validRoles.some(
          savedRole => savedRole.id === role.id
        )
      ) {
        validRoles.push(role);
      }
    }

    // عدم إضافة أي عضو ليس لديه رول خاص
    if (validRoles.length === 0) {
      continue;
    }

    users.set(userId, validRoles);
  }

  return users;
}

// ترتيب أصحاب الرولات الخاصة حسب النقاط
function getSorted(guild) {
  const stats = getStats(guild.id);
  const privateRoles = getPrivateRoles(guild);

  const users = [];

  for (const [userId, roles] of privateRoles) {
    const data = stats[userId] || {};

    users.push({
      id: userId,
      roles: roles,

      points: Number(data.points) || 0,
      messages: Number(data.messages) || 0,
      voice: Number(data.voice) || 0,
      invites: Number(data.invites) || 0
    });
  }

  // الأعلى نقاطًا أولًا
  users.sort((a, b) => {
    return (
      b.points - a.points ||
      b.messages - a.messages ||
      b.voice - a.voice ||
      b.invites - a.invites
    );
  });

  return users;
}

// تنسيق الأرقام
function formatNumber(number) {
  return Number(number || 0).toLocaleString("en-US");
}

// إنشاء إمبد التوب
function createEmbed(message, users, page) {
  const totalPages = Math.max(
    1,
    Math.ceil(users.length / PAGE_SIZE)
  );

  const start = page * PAGE_SIZE;

  const current = users.slice(
    start,
    start + PAGE_SIZE
  );

  let description = "";

  if (current.length === 0) {
    description =
      "لا توجد رولات خاصة مسجلة وموجودة في السيرفر.";
  } else {
    description = current
      .map((user, index) => {
        const rank = start + index + 1;

        // عرض الرولات الخاصة فقط
        const roleMention = user.roles
          .map(role => `<@&${role.id}>`)
          .join(" ");

        return (
          `**${rank}.** ${roleMention} — ` +
          `**${formatNumber(user.points)} نقطة** · ` +
          `${formatNumber(user.voice)} دقيقة صوتية · ` +
          `${formatNumber(user.messages)} رسالة · ` +
          `${formatNumber(user.invites)} عضو`
        );
      })
      .join("\n\n");
  }

  return new MessageEmbed()
    .setColor("#5865F2")
    .setAuthor({
      name: "الرتب المتميزة ، التوب",
      iconURL:
        message.guild.iconURL({
          dynamic: true
        }) || undefined
    })
    .setDescription(description)
    .setFooter({
      text:
        `صفحة ${page + 1} / ${totalPages} | ` +
        `عدد أصحاب الرولات الخاصة: ${users.length}`
    });
}

// إنشاء أزرار التوب
function createButtons(page, totalPages) {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("top_previous")
      .setLabel("السابق")
      .setEmoji("⬅️")
      .setStyle("SECONDARY")
      .setDisabled(page === 0),

    new MessageButton()
      .setCustomId("top_next")
      .setLabel("التالي")
      .setEmoji("➡️")
      .setStyle("SECONDARY")
      .setDisabled(page >= totalPages - 1),

    new MessageButton()
      .setCustomId("top_refresh")
      .setLabel("تحديث")
      .setEmoji("🔄")
      .setStyle("SECONDARY")
  );
}

module.exports = {
  name: "top",
  aliases: ["توب", "leaderboard"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) {
      return;
    }

    try {
      let page = 0;

      // جلب الرولات الخاصة
      let users = getSorted(message.guild);

      let totalPages = Math.max(
        1,
        Math.ceil(users.length / PAGE_SIZE)
      );

      const topMessage = await message.reply({
        embeds: [
          createEmbed(message, users, page)
        ],
        components: [
          createButtons(page, totalPages)
        ],
        allowedMentions: {
          parse: []
        }
      });

      const collector =
        topMessage.createMessageComponentCollector({
          filter: interaction =>
            interaction.isButton() &&
            [
              "top_previous",
              "top_next",
              "top_refresh"
            ].includes(interaction.customId),

          time: 300000
        });

      collector.on("collect", async interaction => {
        try {
          if (
            interaction.customId === "top_previous"
          ) {
            page = Math.max(0, page - 1);
          }

          if (
            interaction.customId === "top_next"
          ) {
            page = Math.min(
              totalPages - 1,
              page + 1
            );
          }

          if (
            interaction.customId === "top_refresh"
          ) {
            // تحديث الرولات والإحصائيات
            users = getSorted(message.guild);

            totalPages = Math.max(
              1,
              Math.ceil(users.length / PAGE_SIZE)
            );

            page = Math.min(
              page,
              totalPages - 1
            );
          }

          await interaction.update({
            embeds: [
              createEmbed(message, users, page)
            ],
            components: [
              createButtons(page, totalPages)
            ],
            allowedMentions: {
              parse: []
            }
          });

        } catch (error) {
          console.error(
            "TOP BUTTON ERROR:",
            error
          );

          if (!interaction.replied &&
              !interaction.deferred) {
            await interaction.reply({
              content:
                "❌ حدث خطأ أثناء تحديث التوب.",
              ephemeral: true
            }).catch(() => {});
          }
        }
      });

      collector.on("end", async () => {
        await topMessage.edit({
          components: []
        }).catch(() => {});
      });

    } catch (error) {
      console.error("TOP ERROR:", error);

      return message.reply({
        content:
          "❌ حدث خطأ أثناء عرض توب الرولات الخاصة."
      }).catch(() => {});
    }
  }
};
