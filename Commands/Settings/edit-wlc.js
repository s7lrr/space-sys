const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: 'edit-wlc',
    description: 'Edit user details',
    run: async (client, message, args) => {


        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        registerFont(`./Fonts/Cairo-Regular.ttf`, { family: 'Cairo' });

        const initialMenu = new MessageSelectMenu()
        .setCustomId('edit_select')
        .setPlaceholder('اختر ما تريد تحريره')
        .addOptions([
            {
                label: 'إحديثات الاسم',
                value: 'username',
                emoji: '⚒️'
            },
            {
                label: 'إحديثات الافتار',
                value: 'avatar',
                emoji: '⚒️'
            },
            {
                label: 'صورة الولكم',
                value: 'image',
                emoji: '⚒️'
            },
            {
                label: 'شات الولكم',
                value: 'channel',
                emoji: '⚒️'
            },
            {
                label: 'رسالة الولكم',
                value: 'messg',
                emoji: '⚒️'
            }
            
        ]);



        const deleteButton = new MessageButton()
        .setCustomId('Cancele')
        .setLabel('إلغاء')
        .setStyle('DANGER');
  
      const Cancele = new MessageActionRow()
        .addComponents(deleteButton);

        const initialMenuRow = new MessageActionRow()
            .addComponents(initialMenu);
            await message.reply({
                embeds: [{
                    title: '**يرجى تحديد نوع التعديل**',
                    footer: {
                        text: client.user.username,
                        iconURL: client.user.displayAvatarURL()
                    }
                }],
                components: [initialMenuRow,Cancele]
            });
            
        // إنشاء جمع البيانات للتفاعل مع القائمة
        const filter = (interaction) => interaction.user.id === message.author.id && interaction.isSelectMenu();
        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        // الاستماع لتحديد القائمة
        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) return; 
            let selectedOption;
            if (!interaction.optionUsed) {
                selectedOption = interaction.values[0];
                interaction.optionUsed = true;
            }
            // معالجة تحرير اسم المستخدم
            if (selectedOption === 'username') {
                await interaction.message.delete();
                if (message.author.bot) return;
        
                const canvas = createCanvas(826, 427);
                const ctx = canvas.getContext('2d');
        
                // Initial position of username
                let x = canvas.width / 2;
                let y = canvas.height / 2;
        
                // Initial font size
                let fontSize = 40;
        
                const username = message.author.displayName;
        
                // Load background image URL
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);
        
                // Load background image if URL is provided
                let backgroundImage;
                if (backgroundImageURL) {
                    backgroundImage = await loadImage(backgroundImageURL);
                    canvas.width = backgroundImage.width; // Set canvas width to background image width
                    canvas.height = backgroundImage.height; // Set canvas height to background image height
        
                    // Draw background image
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                } else {
                    // Draw transparent background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
        
                // Draw user's avatar with specified settings
                const userAvatarURL = message.author.displayAvatarURL({ format: 'png', size: 1024 });
                const avatar = await loadImage(userAvatarURL);
                const avatarUpdates = Data.get(`editwel_${message.guild.id}`) || { size: 260, x: 233, y: 83.5, isCircular: true };
                const { size, x: avatarX, y: avatarY, isCircular } = avatarUpdates;
                ctx.save();
                if (isCircular) {
                    ctx.beginPath();
                    ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(avatar, avatarX, avatarY, size, size);
                ctx.restore();
        
                // Draw username on canvas
                ctx.font = `${fontSize}px Cairo`; // Change 'Your Font Name' to your font family
                ctx.fillStyle = '#FFFFFF'; // Change color as needed
                ctx.fillText(username, x, y); // Draw username at current position
        
                // Create buttons
                const moveUpButton = new MessageButton()
                    .setCustomId('up')
                    .setEmoji("⬆️")
                    .setStyle('PRIMARY');
        
                const moveDownButton = new MessageButton()
                    .setCustomId('down')
                    .setEmoji("⬇️")
                    .setStyle('PRIMARY');
        
                const moveLeftButton = new MessageButton()
                    .setCustomId('left')
                    .setEmoji("⬅️")
                    .setStyle('PRIMARY');
        
                const moveRightButton = new MessageButton()
                    .setCustomId('right')
                    .setEmoji("➡️")
                    .setStyle('PRIMARY');
        
                const increaseSizeButton = new MessageButton()
                    .setCustomId('increase')
                    .setEmoji("➕")
                    .setStyle('SUCCESS');
        
                const decreaseSizeButton = new MessageButton()
                    .setCustomId('decrease')
                    .setEmoji("➖")
                    .setStyle('DANGER');
        
                const saveButton = new MessageButton()
                    .setCustomId('save')
                    .setEmoji("✅")
                    .setStyle('SUCCESS');
        
                // Add row for buttons
                const row1 = new MessageActionRow().addComponents(moveUpButton, moveDownButton);
                const row2 = new MessageActionRow().addComponents(moveLeftButton, moveRightButton);
                const row3 = new MessageActionRow().addComponents(decreaseSizeButton, increaseSizeButton);
                const row4 = new MessageActionRow().addComponents(saveButton);
        
                // Send canvas image with buttons
                const attachment = { content: '**تعديل إعدادات الترحيب ⚙️**', files: [canvas.toBuffer()], components: [row1, row2, row3, row4] };
                const sentMessage = await message.channel.send(attachment);
        
                // Listen for button interactions
                const filter = (interaction) => interaction.message.id === sentMessage.id && interaction.isButton();
                const collector = sentMessage.createMessageComponentCollector({ filter, time: 2000000 }); // 5 دقائق
        
                let speed = 100; // Speed of movement
        
                collector.on('collect', async (interaction) => {
                    if (interaction.user.id !== message.author.id) return; 
                    if (interaction.replied) return;
        
                    if (interaction.customId === 'up') {
                        y -= speed; // Move username up
                    } else if (interaction.customId === 'down') {
                        y += speed; // Move username down
                    } else if (interaction.customId === 'left') {
                        x -= speed; // Move username left
                    } else if (interaction.customId === 'right') {
                        x += speed; // Move username right
                    } else if (interaction.customId === 'increase') {
                        fontSize += 50; // Increase font size
                    } else if (interaction.customId === 'decrease') {
                        fontSize -= 50; // Decrease font size
                    } else if (interaction.customId === 'save') {
                        // Save updated data to the database
                        Data.set(`editname_${message.guild.id}`, { size: fontSize, x, y, isCircular });
                        // Respond to the interaction
                        row1.components.forEach(component => {
                            component.setDisabled(true);
                        });
                        row2.components.forEach(component => {
                            component.setDisabled(true);
                        });
                        row3.components.forEach(component => {
                            component.setDisabled(true);
                        });
                        row4.components.forEach(component => {
                            component.setDisabled(true);
                        });

                        await interaction.update({ components: [], content: '**تم حفظ الاحديثات بنجاح. ✅**' });
                        return;
                    

                      }
        
                    // Redraw canvas with updated username position and font size
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
        
                    // Draw background image or transparent background
                    if (backgroundImage) {
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
        
                    // Draw user's avatar with specified settings
                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, size, size);
                    ctx.restore();
        
                    ctx.font = `${fontSize}px Cairo`; // Change 'Your Font Name' to your font family
                    ctx.fillStyle = '#FFFFFF'; // Change color as needed
                    ctx.fillText(username, x, y); // Draw username at current position
        
                    // Update message with new canvas
                    const updatedAttachment = { content: '**تعديل إعدادات الترحيب ⚙️**', files: [canvas.toBuffer()], components: [row1, row2, row3, row4] };
                    await interaction.update(updatedAttachment);
                });
        
                collector.on('end', () => {
                    // Remove buttons after 60 seconds
                    row1.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    row2.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    row3.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    row4.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    sentMessage.edit({ content: '**أنتهى وقت التعديل** ❌', components: [row1, row2, row3, row4] });
                });
            }

            // معالجة تعديل الصورة الرمزية
            if (selectedOption === 'avatar') {

                await interaction.message.delete();
                if (message.author.bot) return;

                const canvas = createCanvas(826, 427);
                const ctx = canvas.getContext('2d');
        
                // Background image URL
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);
        
                // Load background image if URL is provided
                let backgroundImage;
                if (backgroundImageURL) {
                    backgroundImage = await loadImage(backgroundImageURL);
                    canvas.width = backgroundImage.width; // Set canvas width to background image width
                    canvas.height = backgroundImage.height; // Set canvas height to background image height
                }
        
                // Load and draw user's avatar
                const user = message.author;
                const avatar = await loadImage(user.displayAvatarURL({ format: 'png' }));
                let avatarSize = 400; // Initial size of avatar
                let avatarX = canvas.width / 2 - avatarSize / 2;
                let avatarY = canvas.height / 2 - avatarSize / 2;
                let isCircular = false;
                
                // Check if it's the first time the command is being used to center the avatar
                const isFirstTime = !message.member.hasEdet;
                
                // Center the avatar if it's the first time
                if (isFirstTime) {
                    avatarX = (canvas.width - avatarSize) / 2;
                    avatarY = (canvas.height - avatarSize) / 2;
                    message.member.hasEdet = true;
                }
                
                // Draw background image or transparent background
                if (backgroundImage) {
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                // Draw avatar on canvas
                ctx.save();
                if (isCircular) {
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();
        
                // Create buttons
                const zoomInButton = new MessageButton()
                    .setCustomId('zoomIn')
                    .setEmoji("➕")
                    .setStyle('SECONDARY');
        
                const moveUpButton = new MessageButton()
                    .setCustomId('up')
                    .setEmoji("⬆️")
                    .setStyle('PRIMARY');
        
                const zoomOutButton = new MessageButton()
                    .setCustomId('zoomOut')
                    .setEmoji("➖")
                    .setStyle('SECONDARY');
        
                const moveDownButton = new MessageButton()
                    .setCustomId('down')
                    .setEmoji("⬇️")
                    .setStyle('PRIMARY');
        
                const leftButton = new MessageButton()
                    .setCustomId('left')
                    .setEmoji("⬅️")
                    .setStyle('PRIMARY');
        
                const rightButton = new MessageButton()
                    .setCustomId('right')
                    .setEmoji("➡️")
                    .setStyle('PRIMARY');
        
                // Add save button
                const saveButton = new MessageButton()
                    .setCustomId('save')
                    .setEmoji("✅")
                    .setStyle('SUCCESS');
        
                // Add button to toggle circular avatar
                const toggleShapeButton = new MessageButton()
                    .setCustomId('toggleShape')
                    .setEmoji("#️⃣")
                    .setStyle('SECONDARY');
        
                // Add delete button
                const deleteButton = new MessageButton()
                    .setCustomId('delete')
                    .setEmoji("❌")
                    .setStyle('DANGER');
        
                const row1 = new MessageActionRow()
                    .addComponents(zoomInButton, moveUpButton, zoomOutButton);
        
                const row2 = new MessageActionRow()
                    .addComponents(leftButton, saveButton, rightButton);
        
                // Add row for save and toggle shape buttons
                const row3 = new MessageActionRow()
                    .addComponents(toggleShapeButton, moveDownButton, deleteButton);
        
                // Send canvas image with buttons
                const attachment = { content: '**تعديل إعدادات الترحيب ⚙️**', files: [canvas.toBuffer()], components: [row1, row2, row3] };
                const sentMessage = await message.channel.send(attachment);
        
                // Listen for button interactions
                const filter = (interaction) => interaction.message.id === sentMessage.id && interaction.isButton();
                const collector = sentMessage.createMessageComponentCollector({ filter, time: 2000000 }); // 5 دقائق
        
                let speed = 10; // Speed of movement
                let zoomSpeed = 15; // Speed of zooming
        
                collector.on('collect', async (interaction) => {
                    // Check if the interaction has already been replied to
                    if (interaction.replied) return;
        
                    const member = interaction.member;
                    if (!member) return;
        
                    if (interaction.customId === 'up') {
                        avatarY -= speed;
                    } else if (interaction.customId === 'down') {
                        avatarY += speed;
                    } else if (interaction.customId === 'left') {
                        avatarX -= speed;
                    } else if (interaction.customId === 'right') {
                        avatarX += speed;
                    } else if (interaction.customId === 'zoomIn') {
                        avatarSize += zoomSpeed;
                    } else if (interaction.customId === 'zoomOut') {
                        avatarSize -= zoomSpeed;
                    } else if (interaction.customId === 'save') {
                        // Save avatar position, size, and shape to database
                        Data.set(`editwel_${message.guild.id}`, {
                            x: avatarX,
                            y: avatarY,
                            size: avatarSize,
                            isCircular: isCircular
                        });
                        // Disable all buttons after saving
                        row1.components.forEach(component => component.setDisabled(true));
                        row2.components.forEach(component => component.setDisabled(true));
                        row3.components.forEach(component => component.setDisabled(true));
                     await interaction.update({ components: [], content: '**تم حفظ الاحديثات بنجاح. ✅**' });
                        return;
                    }
                     else if (interaction.customId === 'toggleShape') {
                        isCircular = !isCircular;
                    } else if (interaction.customId === 'delete') {
                        // Delete data from database
                        if (Data.has(`mesg_message_${message.guild.id}`)) {
                            Data.delete(`mesg_message_${message.guild.id}`);
                        }
                        if (Data.has(`imgwlc_${message.guild.id}`)) {
                            Data.delete(`imgwlc_${message.guild.id}`);
                        }
                        if (Data.has(`chat_wlc_${message.guild.id}`)) {
                            Data.delete(`chat_wlc_${message.guild.id}`);
                        }
                        if (Data.has(`editwel_${message.guild.id}`)) {
                            Data.delete(`editwel_${message.guild.id}`);
                        }
                        
                        row1.components.forEach(component => component.setDisabled(true));
                        row2.components.forEach(component => component.setDisabled(true));
                        row3.components.forEach(component => component.setDisabled(true));
                    }
        
                    // Redraw canvas with updated avatar position and size
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
        
                    // Draw background image or transparent background
                    if (backgroundImage) {
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
        
                    // Draw updated avatar on canvas
                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                    ctx.restore();
        
                    // Update message with new canvas
                    const updatedAttachment = { content: '**تعديل إعدادات الترحيب ⚙️**', files: [canvas.toBuffer()], components: [row1, row2, row3] };
                    await interaction.update(updatedAttachment);
                });
        
                collector.on('end', () => {
                    // Remove buttons after 60 seconds
                    row1.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    row2.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    row3.components.forEach(component => {
                        component.setDisabled(true);
                    });
                    sentMessage.edit({ content: '**أنتهى وقت التعديل** ❌', components: [row1, row2, row3] });
                });

                
            } 
            if (selectedOption === 'image') {
                await interaction.message.delete(); // حذف الرسالة التي يحتوي عليها الأمر من الشات
                if (message.author.bot) return;
            
                let imageURL;
            
                if (args[0]) {
                    imageURL = args[0];
                } else if (message.attachments.size > 0) {
                    imageURL = message.attachments.first().url;
                } else {
                    return message.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️").then(sentMessage => {
                        const filter = m => m.author.id === message.author.id;
                        const collector = message.channel.createMessageCollector({ filter, time: 60000 });
            
                        collector.on('collect', async (msg) => {
                            if (msg.attachments.size > 0) {
                                imageURL = msg.attachments.first().url;
                                await saveImage(message.guild.id, imageURL);
                                message.react('✅');
                                sentMessage.edit("**تم حفظ الصورة بنجاح. ✅**");
                            await msg.delete()
                                collector.stop();
                            } else {
                                msg.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
                            }
                        });
            
                        collector.on('end', () => {
                            if (!imageURL) {
                                sentMessage.edit("**أنتهى وقت التعديل** ❌");
                            }
                        });
                    });
                }
            
                await saveImage(message.guild.id, imageURL);
                        
                async function saveImage(guildId, imageUrl) {
                    const imageName = "welcome.png"; // اسم الصورة الناتجة
                    const imagePath = path.join(process.cwd(), "Fonts", imageName);
                    const response = await fetch(imageUrl);
                    const buffer = await response.buffer();
                    fs.writeFileSync(imagePath, buffer);
                    Data.set(`imgwlc_${guildId}`, imagePath);
                }


            } // إذا كانت الخيارات المحددة "channel" بدلاً من "image"
            if (selectedOption === 'channel') {
                // حذف الرسالة التي يحتوي عليها الأمر من الشات
                await interaction.message.delete();
                
                let selectedChannelID;
                
                if (args[0]) {
                    // إذا كان الإدخال عبارة عن ايدي للشات
                    const channelID = args[0].replace(/\D/g, ''); // استخراج الأرقام فقط من النص
                    if (message.guild.channels.cache.has(channelID)) {
                        selectedChannelID = channelID;
                    }
                }
                
                if (!selectedChannelID) {
                    // إذا لم يتم تحديد قناة باستخدام الايدي، قم بالبحث عن منشن الشات في الرسالة
                    const channelMention = message.mentions.channels.first();
                    if (channelMention) {
                        selectedChannelID = channelMention.id;
                    } else {
                        const requestMessage = await message.reply("**يرجى ارفاق منشن الشات او الايدي .** ⚙️");
                        const filter = m => m.author.id === message.author.id;
                        const collector = message.channel.createMessageCollector({ filter, time: 30000 });
                        
                        collector.on('collect', async (msg) => {
                            const channel = msg.mentions.channels.first();
                            if (channel) {
                                selectedChannelID = channel.id;
                                collector.stop();
                            } else {
                                // يتم تحديد الإدخال كايدي للشات
                                const channelID = msg.content.replace(/\D/g, '');
                                if (message.guild.channels.cache.has(channelID)) {
                                    selectedChannelID = channelID;
                                    collector.stop();
                                } else {
                                    msg.reply("**يرجى ارفاق منشن الشات او الايدي .**⚙️");
                                }
                            }
                        });
                        
                        collector.on('end', () => {
                            if (!selectedChannelID) {
                                // إذا لم يتم تحديد قناة في الوقت المناسب
                                requestMessage.edit("**أنتهى وقت التعديل** ❌");
                            } else {
                                // حفظ القناة المحددة
                                Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                                requestMessage.edit("**تم حفظ القناة بنجاح.** ✅");
                            }
                        });
                    }
                } else {
                    // حفظ القناة المحددة
                    Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                    message.reply("**تم حفظ القناة بنجاح.** ✅");
                }
            } 
            if (selectedOption === 'messg') {
                // حذف الرسالة التي يحتوي عليها الأمر من الشات
                await interaction.message.delete();
            
                let selectedContent;
            
                if (args[0]) {
                    // إذا كان الإدخال عبارة عن النص المراد تعيينه
                    selectedContent = args.join(" ");
                }
            
                if (!selectedContent) {
                    // إذا لم يتم تحديد نص
                    const requestMessage = await message.reply("**يرجى إرفاق رسالة الترحيب** ⚙️\n\`\`\`[user] : يذكر إسم العضو\n[inviter] : يذكر إسم الداعي\n[servername] : يذكر إسم السيرفر\n[membercount] : يذكر عدد أعضاء السيرفر\`\`\`");
                    const filter = m => m.author.id === message.author.id;
                    const collector = message.channel.createMessageCollector({ filter, time: 30000 });
            
                    collector.on('collect', async (msg) => {
                        selectedContent = msg.content;
                        collector.stop();
                    });
            
                    collector.on('end', () => {
                        if (!selectedContent) {
                            // إذا لم يتم تحديد نص في الوقت المناسب
                            requestMessage.edit("**أنتهى وقت التعديل** ❌");
                        } else {
                            // حفظ النص المحدد
                            Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                            requestMessage.edit("**تم حفظ النص بنجاح.** ✅");
                        }
                    });
                } else {
                    // حفظ النص المحدد
                    Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                    message.reply("**تم حفظ النص بنجاح.** ✅");
                }
            }
            
    
        })



        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
      
            if (interaction.customId === 'Cancele') {
              collector.stop();
              interaction.message.delete();
            }
          });

        // إنهاء جمع البيانات بعد انقضاء المهلة
        collector.on('end', () => {
            // إزالة المكونات بعد انتهاء جمع البيانات
            initialMenuRow.components.forEach(component => {
                component.setDisabled(true);
            });
        });
    }
};
