const data = {
  welcome: {
    title:"# welcome",
    topic:"Welcome to the Discorda community.",
    content:`<div class="welcome-card"><h1>Welcome to Discorda 👋</h1><p>This is your new community space. Discorda is a clean, modern chat platform prototype inspired by familiar community apps — with its own branding and interface.</p><p><b>Start here:</b> check the rules, say hello in general, and explore the server.</p></div>`
  },
  rules:{title:"# rules",topic:"Please read the community rules.",content:message("Kryton","Please keep Discorda friendly, respectful and enjoyable for everyone.")},
  announcements:{title:"# announcements",topic:"Important Discorda updates.",content:message("Kryton","Welcome to the new Discorda prototype! More features are coming.")},
  general:{title:"# general",topic:"Chat with the community.",content:message("Arcane","Hey everyone! Welcome to Discorda 👋")+message("Kryton","Hope you like the new design!")},
  media:{title:"# media",topic:"Share screenshots, clips and creations.",content:message("Mia","Check out this new game clip! 🎮")},
  "bot-commands":{title:"# bot-commands",topic:"Run your Discorda bots here.",content:message("Counting","Use /help to see available commands.")},
  General:{title:"🔊 General",topic:"Voice channel",content:"<div class='welcome-card'><h1>General</h1><p>This is a voice channel placeholder for the Discorda prototype.</p></div>"},
  Gaming:{title:"🔊 Gaming",topic:"Voice channel",content:"<div class='welcome-card'><h1>Gaming</h1><p>Jump into a gaming voice channel.</p></div>"},
  AFK:{title:"🔇 AFK",topic:"Voice channel",content:"<div class='welcome-card'><h1>AFK</h1><p>You are currently away.</p></div>"}
};

function message(name,text){
  return `<div class="message"><div class="avatar">${name[0]}</div><div><div><span class="name">${name}</span><span class="time">Today</span></div><p>${text}</p></div></div>`;
}

const messages = document.getElementById("messages");
const title = document.getElementById("channelTitle");
const topic = document.getElementById("channelTopic");
const input = document.getElementById("messageInput");

function openChannel(id){
  const item=data[id]||data.welcome;
  title.textContent=item.title;
  topic.textContent=item.topic;
  messages.innerHTML=item.content;
  input.placeholder=`Message ${item.title}`;
  document.querySelectorAll(".channel").forEach(c=>c.classList.toggle("active",c.dataset.channel===id));
}
document.querySelectorAll(".channel").forEach(c=>c.addEventListener("click",()=>openChannel(c.dataset.channel)));

function send(){
  const value=input.value.trim();
  if(!value)return;
  messages.insertAdjacentHTML("beforeend",message("Kryton",escapeHtml(value)));
  input.value="";
  messages.scrollTop=messages.scrollHeight;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.getElementById("sendBtn").addEventListener("click",send);
input.addEventListener("keydown",e=>{if(e.key==="Enter")send();});

const modal=document.getElementById("settingsModal");
document.getElementById("settingsBtn").onclick=()=>modal.classList.remove("hidden");
document.getElementById("closeSettings").onclick=()=>modal.classList.add("hidden");
document.getElementById("saveSettings").onclick=()=>modal.classList.add("hidden");

openChannel("welcome");
