
const Discord = require("discord.js");
const db = require("pro.db");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "help",

  run: async (client, message, args) => {
    if (!message.guild) return;

    const isEnabled = db.get("command_enabled_help");
    if (isEnabled === false) return;

    const Color =
      db.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const currentDate = new Date();

    const replyembed = new Discord.MessageEmbed()
      .setColor(Color)
      .setThumbnail(
        client.user.displayAvatarURL({ dynamic: true })
      )
      .setFooter(
        `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`
      )
      .setDescription(
        `**أوامر البوت**\n` +
        `يمكنك عرض قائمة الأوامر المناسبة لك\n\n` +
        `**البادئة:** ${prefix || "لا يوجد بادئة"}`
      );

    const options = [
      { label: "الأوامر العامة", value: "help1" },
      { label: "أوامر الإدارة", value: "help2" },
      { label: "أوامر الرولات", value: "help3" },
      { label: "أوامر الشاتات", value: "help4" },
      { label: "أوامر الحماية", value: "help5" },
      { label: "أوامر الإعدادات", value: "help6" },
      { label: "أوامر التذاكر", value: "help7" },
      { label: "الألعاب", value: "help14", emoji: "🎮" },
      {
        label: "إعدادات التقديم",
        value: "help13",
        emoji: "⚙️"
      },
      { label: "أوامر القروبات", value: "help11" },
      { label: "أوامر الرومات الصوتية", value: "help12" },
      { label: "أوامر مالك البوت", value: "help9" },
      { label: "حذف القائمة", value: "help10" }
    ];

    function createRow(disabled = false) {
      return new Discord.MessageActionRow().addComponents(
        new Discord.MessageSelectMenu()
          .setCustomId("help")
          .setPlaceholder("اختر من القائمة")
          .setDisabled(disabled)
          .addOptions(options)
      );
    }

    const sections = {
      help1: {
        title: "الأوامر العامة",
        commands: [
          ["help", "قائمة المساعدة"],
          ["avatar", "عرض صورة شخص"],
          ["banner", "عرض بنر شخص"],
          ["user", "عرض معلومات عضو"],
          ["profile", "عرض بروفايل العضو"],
          ["id", "عرض لفلك أو لفل شخص معين"],
          ["server", "عرض معلومات السيرفر"],
          ["myinv", "عدد دعواتك"],
          ["topinv", "أعلى عدد دعوات"],
          ["mcolors", "اختيار لونك من القائمة"],
          ["colors", "علبة الألوان"],
          ["color", "اختيار لون"],
          ["change", "إضافة فلتر لصورة"],
          ["circle", "عرض صورة العضو على شكل دائرة"],
          ["aremove", "إزالة خلفية الصور"],
          ["semoji", "إرسال صورة الإيموجي"],
          ["edit-image", "فلاتر وتعديل على الصور"]
        ]
      },

      help2: {
        title: "الأوامر الإدارية",
        commands: [
          ["stickers", "إضافة ستيكرز للسيرفر"],
          ["aemoji", "إضافة إيموجي للسيرفر"],
          ["kickofflinebots", "طرد البوتات غير المتصلة"],
          ["blockpic", "بلوك صور"],
          ["blocked", "عرض الأعضاء عليهم بلوك صور"],
          ["removeblockpic", "إزالة بلوك الصور من شخص"],
          ["mute", "إسكات كتابي"],
          ["mymute", "معلومات ميوت العضو"],
          ["unmute", "إلغاء الإسكات الكتابية"],
          ["prison", "سجن عضو"],
          ["myprison", "معلومات سجن العضو"],
          ["unprison", "فك سجن عضو"],
          ["unvmute", "فك ميوت صوتي عن عضو"],
          ["rooms", "إظهار الإداريين الخارجين من الرومات الصوتية"],
          ["adminlist", "إظهار جميع الإداريين بالسيرفر"],
          ["vkick", "طرد عضو من الروم الصوتي"],
          ["vmute", "إسكات عضو من الفويس"],
          ["infractions", "إظهار عقوبات العضو"],
          ["ban", "حظر العضو"],
          ["unban", "إلغاء الحظر عن شخص"],
          ["unbanal", "إلغاء المحظورين من السيرفر"],
          ["allbans", "قائمة المحظورين"],
          ["lastvoice", "معرفة آخر دخول للرومات الصوتية"],
          ["kick", "طرد عضو من السيرفر"],
          ["setnick", "تغيير اسم عضو داخل السيرفر"],
          ["clear", "مسح رسائل الشات"],
          ["records", "سجل عقوبات العضو"],
          ["move", "سحب عضو إلى روم آخر"],
          ["moveme", "ينقلك إلى عضو بروم آخر"],
          ["warn", "إعطاء تحذير لعضو"],
          ["warnings", "قائمة تحذيرات عضو"],
          ["remove-warn", "إزالة تحذير عضو"],
          ["blacklist", "إعطاء بلاكلست لعضو"],
          ["setupblchat", "تحديد شات البلاكلست"],
          ["unblacklist", "إزالة البلاكلست من عضو"],
          ["timeout", "إعطاء تايم أوت"],
          ["untimeout", "إزالة التايم أوت"],
          ["stats", "إظهار معلومات الإداري"]
        ]
      },

      help3: {
        title: "أوامر الرولات",
        commands: [
          ["setreactionrole", "رياكشن رول"],
          ["rereactrole", "إزالة رياكشن رول"],
          ["role", "إضافة رتبة لعضو"],

          ["srole", "إنشاء رول خاص لعضو"],
          ["myrole", "تعديل رولك الخاص ومشاركته أو حذفه"],
          ["dsrole", "حذف رول خاص"],
          ["editrole", "تعديل اسم الرول أو لونه"],
          ["top", "عرض ترتيب الرولات الخاصة حسب النقاط"],
          ["resettop", "تصفير نقاط وإحصائيات توب الرولات الخاصة"],
          ["checkroles", "كشف الرولات الخاصة المفقودة ومعرفة أصحابها"],

          ["addrole", "إنشاء رول جديد"],
          ["autorole", "إضافة رتبة لكل عضو يدخل"],
          ["daorole", "حذف تحديد الرول التلقائي"],
          ["allrole", "إعطاء رول لجميع الأعضاء"],
          ["r all -rolename", "إزالة رول من جميع الأعضاء"],
          ["here", "إضافة رول الهير للعضو"],
          ["pic", "إضافة رول الصور للعضو"],
          ["live", "إضافة رتبة تسمح بفتح كام وشير"],
          ["nick", "إضافة رتبة تغيير الاسم"],
          ["check", "تشييك على الأعضاء في الرول"],
          ["checkvc", "تشييك على أعضاء الرول المتصلين بالصوت"]
        ]
      },

      help4: {
        title: "أوامر الشاتات",
        commands: [
          ["ochat", "تحديد شات الأوامر"],
          ["feel", "إعداد شات الفيلنج"],
          ["hide", "إخفاء الشات عن الكل"],
          ["unhide", "إظهار الشات للكل"],
          ["unhideall", "إظهار كل الرومات"],
          ["hideall", "إخفاء كل الرومات"],
          ["lock", "قفل الروم"],
          ["unlock", "فتح الروم"],
          ["slowmode", "تفعيل الوضع البطيء بالروم"],
          ["autoreply", "إضافة كلمة وردها"],
          ["dreply", "حذف كلمة وردها"],
          ["mhide", "إخفاء الشات عن عضو"],
          ["mshow", "إظهار الشات لعضو"],
          ["autoline", "فاصل تلقائي بالشات"],
          ["unline", "تعطيل الفاصل التلقائي"],
          ["setreact", "رياكشن تلقائي بالشات"],
          ["unreact", "تعطيل الرياكشن التلقائي"],
          ["applay", "تفعيل المنشن والصور بالشات"],
          ["disapplay", "تعطيل المنشن والصور بالشات"],
          ["setpic", "شات الصور"],
          ["embed", "كتابة رسالة على شكل إمبد"],
          ["unpic", "تعطيل شات الصور"],
          ["rate", "تقييم تلقائي"],
          ["feedrate", "تحديد شات التقييم التلقائي"],
          ["setrchat", "تعيين شات التقييمات"],
          ["dltrchat", "حذف شات التقييمات"],
          ["setrimage", "تعيين صورة التقييمات"],
          ["setrcolor", "تعيين لون صورة خط التقييمات"]
        ]
      },

      help5: {
        title: "أوامر الحماية",
        commands: [
          ["advice", "نصائح يمكن تفيدك"],
          ["sechard", "تفعيل وإلغاء الحماية القصوى"],
          ["setlimit", "تحديد الحد للحماية"],
          ["maxsec", "تفعيل الحماية المتقدمة"],
          ["sloprot", "تحديد لوق الحماية المتقدمة"],
          ["aprot", "إضافة أشخاص لتخطي الحماية المتقدمة"],
          ["dprot", "إزالة أشخاص من تخطي الحماية المتقدمة"],
          ["status", "حالة الحماية"],
          ["bots", "إظهار البوتات الموجودة بالسيرفر"],
          ["word", "إضافة أو إزالة كلمات يعاقب كاتبها"],
          ["wordlist", "عرض الكلمات التي يعاقب كاتبها"],
          ["pslist", "قائمة الحماية المفعلة والمعطلة"],
          ["restbackup", "استرجاع السيرفر"],
          ["restemoji", "استرجاع إيموجيات السيرفر"],
          ["block", "منع عضو من دخول السيرفر"],
          ["unblock", "فك منع عضو من دخول السيرفر"],
          ["setsecurity", "إنشاء شاتات اللوق"],
          ["wanti", "إضافة أشخاص لتخطي الحماية"],
          ["wantilist", "قائمة الأشخاص المسموح لهم"],
          ["servername", "حماية تغيير اسم السيرفر"],
          ["serveravatar", "حماية تغيير صورة السيرفر"],
          ["setrjoin", "تحديد الإجراء مع الحسابات الجديدة"],
          ["antijoin", "حماية الحسابات الجديدة"],
          ["antibots", "الحماية من البوتات"],
          ["antilink", "الحماية من الروابط"],
          ["antidelete", "حماية حذف الشاتات والرولات"],
          ["anticreate", "حماية إنشاء الشاتات والرولات"],
          ["antispam", "الحماية من السبام"],
          ["antiwebhook", "الحماية من إنشاء ويب هوك"],
          ["antiperms", "الحماية من تغيير صلاحيات الرولات"],
          ["cols", "تعديل حماية الرولات"]
        ]
      },

      help6: {
        title: "أوامر الإعدادات",
        commands: [
          ["allow", "السماح لعضو أو رول باستخدام أمر"],
          ["deny", "منع عضو أو رول من استخدام أمر"],
          ["setgamerole @رول", "تحديد الرول المسموح له بتشغيل الألعاب"],
          ["removegamerole", "إلغاء شرط رول تشغيل الألعاب"],
          ["listallow", "قائمة السماح والصلاحيات"],
          ["permission", "رؤية البرمشنات المفعلة في الرول"],
          ["settings", "تعديل إعدادات السيرفر"],
          ["setlog", "إنشاء شاتات اللوق"],
          ["detlog", "حذف شاتات اللوق"],
          ["setbanlimit", "وضع حد للباند عن طريق البوت"],
          ["chanpro", "تحديد خلفية أمر البروفايل"],
          ["imagechat", "تحديد صورة لعلبة الألوان"],
          ["ctcolors", "إنشاء رولات ألوان"],
          ["setclear", "تحديد أو إلغاء شات المسح التلقائي"],
          ["edit-wlc", "تعديل إعدادات الترحيب"],
          ["edit-avt", "أوامر تعديل سيرفرات الأفتارات"],
          ["clearcat", "تعيين المسح التلقائي للرومات الصوتية"],
          ["rblock", "منع عضو من رول معين"],
          ["runblock", "إزالة الرول المحظور من عضو"],
          ["setuadmin", "تحديد من يستطيع إزالة العقوبة"],
          ["pallow", "السماح بفك العقوبات"],
          ["plist", "قائمة الأشخاص المسموح لهم بفك العقوبات"],
          ["premove", "إزالة صلاحية فك العقوبات"],
          ["reasons", "تعيين أسباب العقوبات"],
          ["locomnd", "تفعيل أو تعطيل أمر"],
          ["setvoice", "تثبيت البوت بفويس"],
          ["progress", "تفعيل أو إيقاف نظام النقاط"],
          ["reset-all", "تصفير جميع نقاط نظام اللفلات"],
          ["reset", "تصفير نقاط عضو"],
          ["rlevel", "قائمة جميع اللفلات"],
          ["dinfractions", "تعديل عقوبات العضو"],
          ["settask", "تحديد المهام الإدارية"],
          ["task", "عرض المهام الإدارية"],
          ["removetask", "إزالة مهمة إدارية"]
        ]
      },

      help7: {
        title: "أوامر التذاكر",
        commands: [
          ["tipanel", "جميع أوامر التحكم بالتذكرة"],
          ["ticlog", "تعيين شات لوق التذكرة"],
          ["tcsend", "إرسال رسالة عند فتح التذكرة"],
          ["tcopen", "تعيين الكاتاقوري"],
          ["setticket", "إعداد رسالة التذكرة"],
          ["tcrole", "إضافة رولات التذكرة"],
          ["tcrestart", "إعادة تعيين التذاكر"],
          ["ticimage", "تعيين صورة التذكرة"],
          ["rename", "تعيين اسم جديد للتذكرة"],
          ["close", "إغلاق التذكرة المفتوحة"]
        ]
      },

      help13: {
        title: "⚙️ إعدادات التقديم",
        commands: [
          [
            "تقديم @عضو",
            "إرسال قائمة التقديم على رول خاص للعضو المحدد"
          ],
          [
            "تقديم روم #الروم",
            "تحديد روم استقبال طلبات التقديم للمراجعة"
          ],
          [
            "تقديم مسؤول إضافة @رتبة",
            "إضافة رتبة مسموح لها بإرسال التقديم للأعضاء"
          ],
          [
            "تقديم مسؤول إزالة @رتبة",
            "إزالة رتبة من مسؤولي إرسال التقديم"
          ],
          [
            "تقديم مراجعة إضافة @رتبة",
            "إضافة رتبة مسؤولة عن قبول ورفض طلبات التقديم"
          ],
          [
            "تقديم مراجعة إزالة @رتبة",
            "إزالة رتبة من مسؤولي مراجعة الطلبات"
          ],
          [
            "تقديم إعدادات",
            "عرض روم الطلبات ومسؤولي التقديم والمراجعة"
          ]
        ]
      },

      // قسم الألعاب
      help14: {
        title: "الألعاب",
        commands: [
          ["__heading__", "الأعلام"],
          ["علم", "بدء جولة تخمين الأعلام لمدة 15 ثانية"],
          ["علم توب", "عرض ترتيب أفضل 10 لاعبين في الأعلام"],
          ["علم نقاط", "عرض نقاطك في لعبة الأعلام"],
          ["علم نقاط @عضو", "عرض نقاط عضو في لعبة الأعلام"],

          ["__heading__", "أسرع"],
          ["اسرع", "تظهر كلمة وأول شخص يكتبها يفوز بنقطة"],

          ["__heading__", "فكك"],
          ["فكك", "تفكيك الكلمة إلى حروف منفصلة بالترتيب"],

          ["__heading__", "النقاط"],
          ["نقاطي", "عرض نقاط أسرع وفكك والأعلام والمجموع الكامل"]
        ]
      },

      help9: {
        title: "أوامر مالك البوت",
        commands: [
          ["vip", "أوامر الأونر"],
          ["guild", "نقل البوت من سيرفر إلى سيرفر"],
          ["dm", "إرسال رسالة لخاص العضو"],
          ["say", "إرسال رسالة عن طريق البوت"],
          ["setprefix", "تغيير بادئة البوت"],
          ["cmunprefix", "استعمال الأوامر بدون برفيكس"],
          ["owners", "قائمة الأونرات"],
          ["setowner", "إضافة أونر للبوت"],
          ["setbanner", "تغيير بنر البوت"],
          ["setavatar", "تغيير صورة البوت"],
          ["rembanner", "إزالة بنر البوت"],
          ["setname", "تغيير اسم البوت"],
          ["setstatus", "تغيير حالة البوت"],
          ["setecolor", "تغيير لون الإمبد"],
          ["removeowner", "إزالة أونر من البوت"],
          ["acomnd", "إضافة اختصار للأوامر"],
          ["listlcomnd", "عرض قائمة الاختصارات"],
          ["removeShortcut", "حذف اختصار"],
          ["resetbot", "فورمات للبوت كامل"],
          ["uptime", "مدة تشغيل البوت"],
          ["restart", "إعادة تشغيل البوت"]
        ]
      },

      help11: {
        title: "أوامر القروبات",
        commands: [
          ["cgroup", "إنشاء قروب جديد"],
          ["delgroup", "حذف قروب"],
          ["grole", "إضافة رول القروب إلى العضو"],
          ["panel", "لوحة تحكم القروبات"],
          ["rerole", "إزالة رول القروب من العضو"]
        ]
      },

      help12: {
        title: "أوامر الرومات الصوتية",
        commands: [
          ["callow", "السماح لعضو بدخول الروم الصوتي"],
          ["cdeny", "منع عضو من دخول الروم الصوتي"],
          ["chide", "إخفاء الروم الصوتي عن عضو"],
          ["clist", "قائمة الممنوعين من دخول روم معين"],
          ["cunhide", "إظهار الروم الصوتي لعضو"]
        ]
      }
    };

    function createEmbeds(section) {
      const commandPrefix = prefix || "+";

      const lines = section.commands.map(([command, description]) => {
        if (command === "__heading__") {
          return `\n# ${description}\n`;
        }

        return `**${commandPrefix}${command}** : **${description}**`;
      });

      // عناوين كبيرة للأوامر العامة والألعاب
      if (section === sections.help1) {
        lines.unshift("# الأوامر العامة\n");
      }

      if (section === sections.help14) {
        lines.unshift("# الألعاب\n");
      }

      const pages = [];
      let current = "";

      for (const line of lines) {
        if ((current + "\n" + line).length > 3500) {
          pages.push(current);
          current = "";
        }

        current += (current ? "\n" : "") + line;
      }

      if (current) pages.push(current);

      return pages.map((description, index) =>
        new Discord.MessageEmbed()
          .setColor(Color)
          .setTitle(section.title)
          .setDescription(description)
          .setFooter(`صفحة ${index + 1} / ${pages.length}`)
      );
    }

    const helpMessage = await message.reply({
      embeds: [replyembed],
      components: [createRow()]
    });

    const collector =
      helpMessage.createMessageComponentCollector({
        filter: interaction =>
          interaction.isSelectMenu() &&
          interaction.customId === "help",
        time: 2000000
      });

    collector.on("collect", async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "القائمة لصاحب الأمر فقط.",
          ephemeral: true
        });
      }

      const selected = interaction.values[0];

      if (selected === "help10") {
        await interaction.deferUpdate();
        await helpMessage.delete().catch(() => {});
        collector.stop();
        return;
      }

      const section = sections[selected];

      if (!section) {
        return interaction.deferUpdate();
      }

      const embeds = createEmbeds(section);

      await interaction.update({
        embeds,
        components: [createRow()]
      });
    });

    collector.on("end", async () => {
      await helpMessage.edit({
        components: [createRow(true)]
      }).catch(() => {});
    });
  }
};
