
const Discord = require("discord.js");
const db = require("pro.db");

module.exports = {
  name: "setgamerole",

  run: async (client, message, args) => {
    if (!message.guild) return;

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("هذا الأمر للإدارة فقط.");
    }

    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]);

    if (!role) {
      return message.reply(
        "حدد رول الألعاب بالمنشن أو الآيدي.\n" +
        "مثال: `+setgamerole @Games`"
      );
    }

    db.set(`games_role_${message.guild.id}`, role.id);

    const embed = new Discord.MessageEmbed()
      .setColor("#B99568")
      .setTitle("إعدادات الألعاب")
      .setDescription(
        `تم تحديد رول تشغيل الألعاب: ${role}\n\n` +
        "الآن لا يستطيع تشغيل أسرع أو فكك أو الأعلام " +
        "إلا الأعضاء الذين يمتلكون هذا الرول."
      );

    return message.reply({ embeds: [embed] });
  }
};
