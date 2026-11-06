const {db,Discord}=require('./game_shared');
module.exports={name:'نقاطي',aliases:['نقاط-الالعاب'],run:async(client,message)=>{
 if(!message.guild||message.author.bot)return;
 const id=message.author.id,guild=message.guild.id;
 const flags=Number(db.get(`flags_points_${guild}_${id}`))||0;
 const fastest=Number(db.get(`asra_points_${guild}_${id}`))||0;
 const breakWord=Number(db.get(`fakak_points_${guild}_${id}`))||0;
 const total=flags+fastest+breakWord;
 const embed=new Discord.MessageEmbed().setColor('#B99568').setTitle('نقاطي في الألعاب')
 .setDescription(`اللاعب: ${message.author}\n\nنقاط أسرع: **${fastest}**\nنقاط فكك: **${breakWord}**\nنقاط الأعلام: **${flags}**\n\nمجموع نقاطك: **${total}**`)
 .setFooter({text:'Games Points'});
 return message.reply({embeds:[embed],allowedMentions:{parse:[]}});
}};
