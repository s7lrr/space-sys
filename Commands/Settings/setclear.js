const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
    name: "setclear",
    description: "To set channel room",
    usage: "!setclear <channel>",
    run: async (client, message) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#f5f5ff';
        if (!Color) return;

        const mentionedChannel = message.mentions.channels.first();
        const channelIdArgument = message.content.split(" ")[1];
        const channel = mentionedChannel || message.guild.channels.cache.get(channelIdArgument);

        if (!channel) {
      const embed = new MessageEmbed()
      .setColor(`${Color || `#f5f5ff`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setclear <#${message.channel.id}>**`);
      return message.reply({ embeds: [embed] });
    
        }


        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('clearOptions')
                .setPlaceholder('قم باختيار الخيار المناسب لك.')
                .addOptions([
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام القائمة',
                        value: 'colorsClear',
                        emoji: ``
                    },
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام العادي',
                        value: 'normalClear',
                        emoji: ``

                    },{
                        label: 'إلغاء تحديد',
                        description: 'لإلغاء تحديد شاتات علبه الآلوان المحفوظه',
                        value: 'Deletecolorslinst',
                        emoji: ``

                    },
                ]),
        );

        const deleteButton = new MessageButton()
            .setCustomId('Cancel2')
            .setLabel('الغاء')
            .setStyle('DANGER');

        const buttonRow = new MessageActionRow().addComponents(deleteButton);

        await message.reply({ content: '**اختار النظام المفضل لديك لعلبة الألوان.**', components: [row, buttonRow] });

        const filter = interaction => {
            return interaction.customId === 'clearOptions' && interaction.user.id === message.author.id;
        };

        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            const selectedValue = interaction.values[0];
            
            if (selectedValue === 'colorsClear') {
                if (db.has(`avtclear`)) {
                    db.delete(`avtclear`);
                    await message.react("✅");
                }
                db.set(`Channel = [ Colors ]`, channel.id);
                await message.react("✅");
                await interaction.message.delete();
            } else if (selectedValue === 'normalClear') {
                if (db.has(`Channel = [ Colors ]`)) {
                    db.delete(`Channel = [ Colors ]`);
                    await message.react("✅");
                }
                db.set(`avtclear`, channel.id);
                await message.react("✅");
                await interaction.message.delete();
            } else if (selectedValue === 'Deletecolorslinst') {
                if (db.has(`Channel = [ Colors ]`)) {
                    db.delete(`Channel = [ Colors ]`);
                    await message.react("✅");
                }
                if (db.has(`avtclear`)) {
                    db.delete(`avtclear`);
                    await message.react("✅");
                }
                await interaction.message.delete();
            }
            collector.stop();
        });
        
        


        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'Cancel2') {
                interaction.message.delete();
            }
        });
    },
};
