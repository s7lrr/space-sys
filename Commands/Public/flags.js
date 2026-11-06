
const Discord = require("discord.js");
const Canvas = require("canvas");
const https = require("https");
const db = require("pro.db");

const games = new Map();
const flagCache = new Map();
const GAME_TIME = 15000;

const countries = [
  ["sa", "السعودية", "السعوديه", "المملكة العربية السعودية"],
  ["ae", "الإمارات", "الامارات", "الامارات العربية المتحدة"],
  ["kw", "الكويت"],
  ["qa", "قطر"],
  ["bh", "البحرين"],
  ["om", "عمان", "سلطنة عمان"],
  ["ye", "اليمن"],
  ["iq", "العراق"],
  ["jo", "الأردن", "الاردن"],
  ["ps", "فلسطين"],
  ["sy", "سوريا"],
  ["lb", "لبنان"],
  ["eg", "مصر"],
  ["ma", "المغرب"],
  ["dz", "الجزائر"],
  ["tn", "تونس"],
  ["ly", "ليبيا"],
  ["sd", "السودان"],
  ["tr", "تركيا"],
  ["fr", "فرنسا"],
  ["de", "ألمانيا", "المانيا"],
  ["it", "إيطاليا", "ايطاليا"],
  ["es", "إسبانيا", "اسبانيا"],
  ["pt", "البرتغال"],
  ["gb", "بريطانيا", "المملكة المتحدة"],
  ["us", "أمريكا", "امريكا", "الولايات المتحدة"],
  ["ca", "كندا"],
  ["br", "البرازيل"],
  ["ar", "الأرجنتين", "الارجنتين"],
  ["mx", "المكسيك"],
  ["jp", "اليابان"],
  ["cn", "الصين"],
  ["kr", "كوريا الجنوبية", "كوريا"],
  ["in", "الهند"],
  ["pk", "باكستان"],
  ["id", "إندونيسيا", "اندونيسيا"],
  ["my", "ماليزيا"],
  ["th", "تايلاند"],
  ["ru", "روسيا"],
  ["ua", "أوكرانيا", "اوكرانيا"],
  ["se", "السويد"],
  ["no", "النرويج"],
  ["fi", "فنلندا"],
  ["ch", "سويسرا"],
  ["nl", "هولندا"],
  ["be", "بلجيكا"],
  ["gr", "اليونان"],
  ["au", "أستراليا", "استراليا"],
  ["nz", "نيوزيلندا"],
  ["za", "جنوب أفريقيا", "جنوب افريقيا"],
  ["ng", "نيجيريا"],
  ["ke", "كينيا"],
  ["ir", "إيران", "ايران"],
  ["af", "أفغانستان", "افغانستان"],
  ["sg", "سنغافورة"],
  ["ph", "الفلبين"],
  ["vn", "فيتنام"],
  ["pl", "بولندا"],
  ["at", "النمسا"],
  ["dk", "الدنمارك"],
  ["hr", "كرواتيا"]
];

// تنظيف الإجابات
function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ");
}

// نظام النقاط الأصلي
function getKey(guildId, userId) {
  return `flags_points_${guildId}_${userId}`;
}

function getPoints(guildId, userId) {
  return Number(db.get(getKey(guildId, userId))) || 0;
}

function addPoint(guildId, userId) {
  const points = getPoints(guildId, userId) + 1;

  db.set(getKey(guildId, userId), points);

  const playersKey = `flags_players_${guildId}`;
  const saved = db.get(playersKey);
  const players = Array.isArray(saved) ? saved : [];

  if (!players.includes(userId)) {
    players.push(userId);
    db.set(playersKey, players);
  }

  return points;
}

// تحميل صورة العلم
function downloadImage(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) {
      return reject(new Error("Too many redirects"));
    }

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "image/png,image/*"
        },
        timeout: 12000
      },
      response => {
        const status = response.statusCode;

        if (
          [301, 302, 303, 307, 308].includes(status) &&
          response.headers.location
        ) {
          const nextUrl = new URL(
            response.headers.location,
            url
          ).toString();

          response.resume();

          return resolve(
            downloadImage(nextUrl, redirects + 1)
          );
        }

        if (status !== 200) {
          response.resume();
          return reject(
            new Error(`Flag image HTTP ${status}`)
          );
        }

        const chunks = [];

        response.on("data", chunk => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const buffer = Buffer.concat(chunks);

          if (!buffer.length) {
            return reject(
              new Error("Flag image is empty")
            );
          }

          resolve(buffer);
        });

        response.on("error", reject);
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error("Flag download timed out")
      );
    });

    request.on("error", reject);
  });
}

async function getFlagImage(code) {
  if (flagCache.has(code)) {
    return Canvas.loadImage(flagCache.get(code));
  }

  const urls = [
    `https://flagcdn.com/w640/${code}.png`,
    `https://flagcdn.com/w320/${code}.png`
  ];

  let lastError;

  for (const url of urls) {
    try {
      const buffer = await downloadImage(url);
      const image = await Canvas.loadImage(buffer);

      flagCache.set(code, buffer);
      return image;
    } catch (error) {
      lastError = error;

      console.error(
        `FLAG DOWNLOAD FAILED (${code}):`,
        error.message
      );
    }
  }

  throw lastError || new Error("Could not load flag");
}

// رسم الإطار
function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);

  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(
    x + w, y + h, x + w - r, y + h
  );

  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);

  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);

  ctx.closePath();
}

// تصميم صورة اللعبة
async function drawFlag(country, round) {
  const canvas = Canvas.createCanvas(900, 520);
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(
    0, 0, 900, 520
  );

  bg.addColorStop(0, "#111820");
  bg.addColorStop(1, "#20242D");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 900, 520);

  ctx.strokeStyle = "#B99568";
  ctx.lineWidth = 2;

  rounded(ctx, 24, 24, 852, 472, 24);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#E8C18C";
  ctx.font = "bold 37px Arial";

  ctx.fillText("GUESS THE FLAG", 450, 85);

  ctx.fillStyle = "#ADB4BF";
  ctx.font = "21px Arial";

  ctx.fillText(
    "Which country is this?",
    450,
    120
  );

  ctx.fillStyle = "#10151C";

  rounded(ctx, 220, 151, 460, 276, 17);
  ctx.fill();

  ctx.strokeStyle = "#C8A476";
  ctx.lineWidth = 2;

  rounded(ctx, 220, 151, 460, 276, 17);
  ctx.stroke();

  const flag = await getFlagImage(country[0]);

  const scale = Math.min(
    420 / flag.width,
    238 / flag.height
  );

  const width = flag.width * scale;
  const height = flag.height * scale;

  const x = 450 - width / 2;
  const y = 289 - height / 2;

  ctx.drawImage(flag, x, y, width, height);

  ctx.fillStyle = "#E8C18C";
  ctx.font = "bold 20px Arial";

  ctx.fillText(`ROUND ${round}`, 450, 459);

  ctx.fillStyle = "#AEB4C0";
  ctx.font = "16px Arial";

  ctx.fillText(
    "15 SECONDS  |  1 POINT",
    450,
    485
  );

  return canvas.toBuffer("image/png");
}

// ترتيب الأعلام
async function showTop(message) {
  const guildId = message.guild.id;

  const saved = db.get(
    `flags_players_${guildId}`
  );

  const players = Array.isArray(saved)
    ? saved
    : [];

  const ranking = [...new Set(players)]
    .map(id => ({
      id,
      points: getPoints(guildId, id)
    }))
    .filter(player => player.points > 0)
    .sort((a, b) => b.points - a.points);

  const description = ranking.length
    ? ranking
        .slice(0, 10)
        .map((player, index) => {
          return (
            `**${index + 1}.** <@${player.id}>` +
            ` — **${player.points}** نقطة`
          );
        })
        .join("\n\n")
    : "لا توجد نقاط مسجلة حتى الآن.";

  const embed = new Discord.MessageEmbed()
    .setColor("#B99568")
    .setTitle("ترتيب لعبة الأعلام")
    .setDescription(description)
    .setFooter({
      text: "Flag Challenge"
    });

  return message.reply({
    embeds: [embed],
    allowedMentions: {
      parse: []
    }
  });
}

// أمر الأعلام
module.exports = {
  name: "علم",
  aliases: ["flags", "اعلام"],

  run: async (client, message, args) => {
    if (!message.guild || message.author.bot) {
      return;
    }

    args = Array.isArray(args) ? args : [];

    const sub = normalize(args[0]);

    // التوب متاح للجميع
    if (sub === "توب" || sub === "top") {
      return showTop(message);
    }

    // النقاط متاحة للجميع
    if (sub === "نقاط" || sub === "points") {
      const user =
        message.mentions.users.first() ||
        message.author;

      const points = getPoints(
        message.guild.id,
        user.id
      );

      const embed = new Discord.MessageEmbed()
        .setColor("#B99568")
        .setTitle("نقاط الأعلام")
        .setDescription(
          `اللاعب: ${user}\n` +
          `النقاط: **${points}**`
        );

      return message.reply({
        embeds: [embed],
        allowedMentions: {
          parse: []
        }
      });
    }

    // ========================================
    // التحقق من رول تشغيل الألعاب
    // ========================================
    const gameRoleId = db.get(
      `games_role_${message.guild.id}`
    );

    if (
      gameRoleId &&
      !message.member.roles.cache.has(gameRoleId)
    ) {
      return message.reply(
        `ما تقدر تبدأ لعبة الأعلام إلا إذا معك رول <@&${gameRoleId}>.`
      );
    }

    // ========================================
    // بدء الجولة
    // ========================================
    const channelId = message.channel.id;

    if (games.has(channelId)) {
      return message.reply(
        "توجد جولة شغالة حاليًا في هذا الروم."
      );
    }

    games.set(channelId, true);

    try {
      const guildId = message.guild.id;

      const roundKey =
        `flags_round_${guildId}_${channelId}`;

      const lastKey =
        `flags_last_${guildId}_${channelId}`;

      const round =
        Number(db.get(roundKey) || 0) + 1;

      const last = db.get(lastKey);

      const available = countries.filter(
        country => country[0] !== last
      );

      const country = available[
        Math.floor(Math.random() * available.length)
      ];

      const buffer = await drawFlag(
        country,
        round
      );

      const attachment =
        new Discord.MessageAttachment(
          buffer,
          "flag.png"
        );

      const embed = new Discord.MessageEmbed()
        .setColor("#B99568")
        .setTitle("تخمين العلم")
        .setDescription(
          "ما اسم الدولة الموجودة في الصورة؟\n\n" +
          "أول إجابة صحيحة تحصل على نقطة.\n" +
          "مدة الجولة: **15 ثانية**."
        )
        .setImage("attachment://flag.png")
        .setFooter({
          text: `الجولة ${round}`
        });

      await message.channel.send({
        embeds: [embed],
        files: [attachment]
      });

      db.set(roundKey, round);
      db.set(lastKey, country[0]);

      let answered = false;

      const collector =
        message.channel.createMessageCollector({
          filter: msg => !msg.author.bot,
          time: GAME_TIME
        });

      collector.on("collect", msg => {
        if (answered) return;

        const answer = normalize(msg.content);

        const correct = country
          .slice(1)
          .some(name => {
            return normalize(name) === answer;
          });

        if (!correct) return;

        answered = true;
        collector.stop("winner");

        const points = addPoint(
          guildId,
          msg.author.id
        );

        const winEmbed = new Discord.MessageEmbed()
          .setColor("#65B58B")
          .setTitle("إجابة صحيحة")
          .setDescription(
            `الفائز: ${msg.author}\n` +
            `الدولة: **${country[1]}**\n` +
            `مجموع نقاطه: **${points}**`
          );

        message.channel.send({
          embeds: [winEmbed],
          allowedMentions: {
            parse: []
          }
        }).catch(console.error);
      });

      collector.on("end", (_, reason) => {
        games.delete(channelId);

        if (reason === "winner") {
          return;
        }

        const endEmbed = new Discord.MessageEmbed()
          .setColor("#B99568")
          .setTitle("انتهى الوقت")
          .setDescription(
            `الإجابة الصحيحة: **${country[1]}**`
          );

        message.channel.send({
          embeds: [endEmbed]
        }).catch(console.error);
      });

    } catch (error) {
      games.delete(channelId);

      console.error(
        "FLAGS GAME ERROR:",
        error
      );

      return message.reply(
        "تعذر تشغيل الجولة. تأكد من اتصال الإنترنت ومكتبة canvas."
      ).catch(console.error);
    }
  }
};
