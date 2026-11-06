
const Pro = require("pro.db");
const sharp = require("sharp");
const { MessageAttachment } = require("discord.js");

const activeUsers = new Set();

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  name: "addstickers",
  aliases: ["stickers"],

  run: async (client, message, args) => {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.react("❌").catch(() => {});
    }

    if (Pro.get(`command_enabled_${module.exports.name}`) === false) {
      return;
    }

    const sessionKey =
      `${message.guild.id}:${message.channel.id}:${message.author.id}`;

    if (activeUsers.has(sessionKey)) {
      return message.delete().catch(() => {});
    }

    activeUsers.add(sessionKey);

    const messagesToDelete = [message];

    const track = (msg) => {
      if (msg) messagesToDelete.push(msg);
      return msg;
    };

    const cleanup = async () => {
      for (const msg of messagesToDelete) {
        if (msg?.deletable) {
          await msg.delete().catch(() => {});
        }
      }
    };

    const waitForMessage = async (time = 30000) => {
      const collected = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time
      });

      return collected.first();
    };

    try {
      // 1. طلب الصورة
      const imagePrompt = track(
        await message.channel.send(
          `🖼️ <@${message.author.id}> **ارسل الصورة خلال 30 ثانية.**`
        )
      );

      const imageMessage = await waitForMessage();

      if (!imageMessage) {
        throw new Error("انتهى الوقت ولم يتم إرسال صورة.");
      }

      track(imageMessage);

      const attachment = imageMessage.attachments.first();

      if (!attachment) {
        throw new Error("لم ترسل صورة.");
      }

      if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(attachment.name || "")) {
        throw new Error("صيغة الصورة غير مدعومة.");
      }

      // 2. تحميل الصورة
      const maxInputSize = 10 * 1024 * 1024;

      if (attachment.size > maxInputSize) {
        throw new Error("الصورة أكبر من 10MB.");
      }

      const response = await fetch(attachment.url);

      if (!response.ok) {
        throw new Error(`فشل تحميل الصورة: ${response.status}`);
      }

      const chunks = [];
      let totalSize = 0;

      for await (const chunk of response.body) {
        totalSize += chunk.length;

        if (totalSize > maxInputSize) {
          throw new Error("الصورة أكبر من 10MB.");
        }

        chunks.push(chunk);
      }

      const inputBuffer = Buffer.concat(chunks);

      await imageMessage.delete().catch(() => {});
      await imagePrompt.delete().catch(() => {});

      // 3. طلب اسم الستيكر
      const namePrompt = track(
        await message.channel.send(
          `✏️ <@${message.author.id}> **اكتب اسم الستيكر خلال 30 ثانية.**`
        )
      );

      const nameMessage = await waitForMessage();

      if (!nameMessage) {
        throw new Error("انتهى الوقت ولم يتم كتابة الاسم.");
      }

      track(nameMessage);

      let stickerName = nameMessage.content
        .trim()
        .replace(/[^\p{L}\p{N}_-]/gu, "_")
        .slice(0, 30);

      if (stickerName.length < 2) {
        throw new Error("اسم الستيكر لازم يكون حرفين على الأقل.");
      }

      await nameMessage.delete().catch(() => {});
      await namePrompt.delete().catch(() => {});

      // 4. تجهيز الستيكر
      const status = track(
        await message.channel.send(
          "⏳ **جاري تجهيز الستيكر وإضافته للسيرفر...**"
        )
      );

      // 5. إزالة الفراغات الشفافة وتكبير المحتوى
      let processedBuffer = inputBuffer;

      try {
        const originalMetadata = await sharp(inputBuffer).metadata();

        if (originalMetadata.hasAlpha) {
          processedBuffer = await sharp(inputBuffer, {
            animated: false,
            limitInputPixels: 25000000
          })
            .rotate()
            .trim({
              background: "#00000000",
              threshold: 5
            })
            .png()
            .toBuffer();
        }

      } catch (trimError) {
        console.log(
          "Trim skipped:",
          trimError.message
        );

        processedBuffer = inputBuffer;
      }

      // تكبير الصورة مع الحفاظ على أبعادها
      async function convertImage(options = {}) {
        return sharp(processedBuffer, {
          animated: false,
          limitInputPixels: 25000000
        })
          .rotate()
          .resize(320, 320, {
            fit: "contain",
            background: {
              r: 0,
              g: 0,
              b: 0,
              alpha: 0
            },
            withoutEnlargement: false
          })
          .png({
            compressionLevel: 9,
            palette: options.palette || false,
            ...(options.palette
              ? { quality: options.quality || 80 }
              : {})
          })
          .toBuffer();
      }

      // PNG عادي أولًا
      let outputBuffer = await convertImage();

      // ضغط الصورة عند الحاجة
      if (outputBuffer.length > 512 * 1024) {
        outputBuffer = await convertImage({
          palette: true,
          quality: 90
        });
      }

      if (outputBuffer.length > 512 * 1024) {
        outputBuffer = await convertImage({
          palette: true,
          quality: 70
        });
      }

      if (outputBuffer.length > 512 * 1024) {
        outputBuffer = await convertImage({
          palette: true,
          quality: 45
        });
      }

      if (outputBuffer.length > 512 * 1024) {
        throw new Error(
          "تعذر ضغط الصورة إلى أقل من 512KB."
        );
      }

      // 6. التحقق من الصورة
      const metadata = await sharp(outputBuffer).metadata();

      console.log("Sticker Debug:", {
        name: stickerName,
        bytes: outputBuffer.length,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        signature: outputBuffer.subarray(0, 8).toString("hex")
      });

      if (
        metadata.format !== "png" ||
        metadata.width !== 320 ||
        metadata.height !== 320
      ) {
        throw new Error(
          "فشل تجهيز الصورة بصيغة PNG صحيحة."
        );
      }

      // 7. إضافة الستيكر للسيرفر
      const stickerFile = new MessageAttachment(
        outputBuffer,
        "sticker.png"
      );

      const createdSticker = await message.guild.stickers.create(
        stickerFile,
        stickerName,
        "🙂"
      );

      await status.edit(
        `✅ **تم إضافة الستيكر \`${createdSticker.name}\` بنجاح!**`
      );

      // الانتظار ثم حذف جميع الرسائل
      await sleep(3000);

    } catch (error) {
      console.error("Add Sticker Error:", error);

      let errorMessage = error.message;

      if (error.code === 50046) {
        errorMessage =
          "ديسكورد رفض ملف الستيكر (Invalid Asset). راجع Sticker Debug في الكونسول.";
      }

      track(
        await message.channel.send(
          `❌ **فشل إضافة الستيكر:** ${errorMessage}`
        ).catch(() => null)
      );

      await sleep(5000);

    } finally {
      await cleanup();
      activeUsers.delete(sessionKey);
    }
  }
};
