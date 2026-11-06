
const { play, db } = require("./game_shared");

const words = [
  "السعودية", "برمودا", "فيجي", "الرياض", "القمر", "الشمس",
  "المدرسة", "الجامعة", "المستشفى", "السيارة", "الطائرة",
  "المطار", "الحديقة", "المكتبة", "البرتقال", "التفاح",
  "الفراولة", "الكمبيوتر", "الهاتف", "الإنترنت", "الصحراء",
  "المحيط", "البحر", "الجبل", "الثلج", "المطر",
  "النمر", "الأسد", "الفهد", "الحصان", "الفراشة",
  "الساعة", "المفتاح", "المهندس", "الطبيب", "المعلم",
  "الكتاب", "القلم", "الدفتر", "النافذة"
];

module.exports = {
  name: "اسرع",
  aliases: ["أسرع"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) return;

    // التحقق من رول الألعاب
    const gameRoleId = db.get(
      `games_role_${message.guild.id}`
    );

    if (
      gameRoleId &&
      !message.member.roles.cache.has(gameRoleId)
    ) {
      return message.reply(
        `ما تقدر تبدأ لعبة أسرع إلا إذا معك رول <@&${gameRoleId}>.`
      );
    }

    // اختيار كلمة عشوائية بدون تكرار آخر كلمة
    const key =
      `asra_last_${message.guild.id}_${message.channel.id}`;

    const last = db.get(key);
    const available = words.filter(word => word !== last);

    const word = available[
      Math.floor(Math.random() * available.length)
    ];

    db.set(key, word);

    // أول شخص يكتب الكلمة يفوز
    return play(
      message,
      "asra",
      "FASTEST WORD",
      word,
      [word],
      word
    );
  }
};
