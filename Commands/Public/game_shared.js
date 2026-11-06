const Discord = require('discord.js');
const Canvas = require('canvas');
const db = require('pro.db');
const active = new Set();
const DURATION = 15000;
function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[\u064B-\u065F]/g,'').replace(/ـ/g,'').replace(/\s+/g,' ');
}
function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function fitText(ctx, str, maxWidth, initial=46) {
  let size=initial;
  while(size>22) { ctx.font=`bold ${size}px Arial`; if(ctx.measureText(str).width<=maxWidth) break; size-=2; }
  return size;
}
function drawCard(title, prompt, round) {
  const canvas=Canvas.createCanvas(900,520),ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,900,520); bg.addColorStop(0,'#111820'); bg.addColorStop(1,'#20242D');
  ctx.fillStyle=bg; ctx.fillRect(0,0,900,520);
  ctx.strokeStyle='#B99568';ctx.lineWidth=2;roundRect(ctx,24,24,852,472,24);ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle='#E8C18C';ctx.font='bold 37px Arial';ctx.fillText(title,450,85);
  ctx.fillStyle='#ADB4BF';ctx.font='21px Arial';ctx.fillText('15 SECONDS  |  1 POINT',450,120);
  ctx.fillStyle='#10151C';roundRect(ctx,90,151,720,276,17);ctx.fill();
  ctx.strokeStyle='#C8A476';roundRect(ctx,90,151,720,276,17);ctx.stroke();
  ctx.direction='rtl';ctx.fillStyle='#F5E8D5';
  const lines=String(prompt).split('\n');const lineHeight=68;let y=289-(lines.length-1)*lineHeight/2;
  for(const line of lines){const size=fitText(ctx,line,665,50);ctx.font=`bold ${size}px Arial`;ctx.fillText(line,450,y);y+=lineHeight;}
  ctx.direction='ltr';ctx.fillStyle='#E8C18C';ctx.font='bold 20px Arial';ctx.fillText(`ROUND ${round}`,450,459);
  ctx.fillStyle='#AEB4C0';ctx.font='16px Arial';ctx.fillText('GUESS AND WIN',450,485);
  return canvas.toBuffer('image/png');
}
function award(guildId,userId,game){
  const key=`${game}_points_${guildId}_${userId}`;
  const points=(Number(db.get(key))||0)+1;db.set(key,points);
  const playersKey=`${game}_players_${guildId}`;
  const players=db.get(playersKey);const list=Array.isArray(players)?players:[];
  if(!list.includes(userId)){list.push(userId);db.set(playersKey,list);}
  return points;
}
async function play(message, game, title, prompt, accepted, answerLabel){
  if(!message.guild||message.author.bot)return;
  const channelId=message.channel.id;
  if(active.has(channelId))return message.reply('توجد جولة شغالة حاليًا في هذا الروم.');
  active.add(channelId);
  try{
    const guildId=message.guild.id;
    const roundKey=`${game}_round_${guildId}_${channelId}`;
    const round=(Number(db.get(roundKey))||0)+1;
    const attachment=new Discord.MessageAttachment(drawCard(title,prompt,round),'game.png');
    const embed=new Discord.MessageEmbed().setColor('#B99568').setTitle(game==='asra'?'لعبة أسرع':'لعبة فكك')
      .setDescription(game==='asra'?'أول شخص يكتب الكلمة الظاهرة يحصل على نقطة.\nمدة الجولة: **15 ثانية**.':'اكتب حروف الكلمة منفصلة وبالترتيب.\nأول إجابة صحيحة تحصل على نقطة.\nمدة الجولة: **15 ثانية**.')
      .setImage('attachment://game.png').setFooter({text:`الجولة ${round}`});
    await message.channel.send({embeds:[embed],files:[attachment]});
    db.set(roundKey,round);
    let answered=false;
    const collector=message.channel.createMessageCollector({filter:m=>!m.author.bot,time:DURATION});
    collector.on('collect',msg=>{
      if(answered||!accepted.some(a=>normalize(a)===normalize(msg.content)))return;
      answered=true;collector.stop('winner');
      const points=award(guildId,msg.author.id,game);
      const win=new Discord.MessageEmbed().setColor('#65B58B').setTitle('إجابة صحيحة')
        .setDescription(`الفائز: ${msg.author}\nالإجابة: **${answerLabel}**\nمجموع نقاطه في اللعبة: **${points}**`);
      message.channel.send({embeds:[win],allowedMentions:{parse:[]}}).catch(console.error);
    });
    collector.on('end',(_,reason)=>{
      active.delete(channelId);
      if(reason==='winner')return;
      const end=new Discord.MessageEmbed().setColor('#B99568').setTitle('انتهى الوقت').setDescription(`الإجابة الصحيحة: **${answerLabel}**`);
      message.channel.send({embeds:[end]}).catch(console.error);
    });
  }catch(err){active.delete(channelId);console.error('GAME ERROR:',err);return message.reply('تعذر تشغيل الجولة. تأكد من تثبيت مكتبة canvas وصلاحيات البوت.').catch(console.error);}
}
module.exports={play,normalize,db,Discord};
