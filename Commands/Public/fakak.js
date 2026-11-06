
const { play, db } = require("./game_shared");

const words = [
  "السعودية", "الرياض", "مدرسة", "مستشفى",
  "سيارة", "مكتبة", "جامعة", "حاسوب",
  "طائرة", "سفينة", "مطار", "مفتاح",
  "نافذة", "حديقة", "برتقال", "تفاحة",
  "موزة", "شجرة", "قمر", "شمس",
  "نجمة", "بحر", "جبل", "صحراء",
  "مطر", "سحاب", "مظلة", "ساعة",
  "هاتف", "كرسي", "طاولة", "كتاب",
  "قلم", "دفتر", "معلم", "مهندس",
  "طبيب", "مزرعة", "مدينة", "ملعب"
];

module.exports = {
  name: "فكك",
  aliases: ["تفكيك"],

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
        `ما تقدر تبدأ لعبة فكك إلا إذا معك رول <@&${gameRoleId}>.`
      );
    }

    // اختيار كلمة بدون تكرار آخر كلمة
    const key =
      `fakak_last_${message.guild.id}_${message.channel.id}`;

    const last = db.get(key);
    const available = words.filter(word => word !== last);

    const word = available[
      Math.floor(Math.random() * available.length)
    ];

    db.set(key, word);

    // الإجابة تكون الحروف مفصولة بمسافات أو شرطات
    const spaced = [...word].join(" ");

    return play(
      message,
      "fakak",
      "BREAK THE WORD",
      word,
      [
        spaced,
        [...word].join("-")
      ],
      spaced
    );
  }
};
