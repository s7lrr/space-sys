
const db = require("pro.db");

module.exports = {
  name: "removegamerole",

  run: async (client, message, args) => {
    if (!message.guild) return;

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("هذا الأمر للإدارة فقط.");
    }

    db.delete(`games_role_${message.guild.id}`);

    return message.reply(
      "تم إلغاء رول الألعاب. الآن يستطيع الجميع تشغيل الألعاب."
    );
  }
};
