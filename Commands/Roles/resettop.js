
const db = require("pro.db");

module.exports = {
  name: "resettop",
  aliases: ["تصفيرالتوب"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply(
        "❌ **هذا الأمر للإدارة فقط.**"
      );
    }

    const guildId = message.guild.id;
    const stats = db.get(`top_stats_${guildId}`) || {};

    // تصفير جميع الأعضاء
    if (args[0] === "all") {
      db.delete(`top_stats_${guildId}`);

      return message.reply(
        "✅ **تم تصفير التوب بالكامل.**"
      );
    }

    const user = message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!user) {
      return message.reply(
        "**الاستخدام:**\n" +
        "`+resettop all` — تصفير الجميع\n" +
        "`+resettop @user` — تصفير شخص"
      );
    }

    delete stats[user.id];

    db.set(`top_stats_${guildId}`, stats);

    return message.reply(
      `✅ **تم تصفير إحصائيات ${user}.**`
    );
  }
};
