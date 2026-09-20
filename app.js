import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================================
   SUPABASE
========================================= */

const SUPABASE_URL = "https://ggrnhhzurugjkgybrpgq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OkgTPJcSX8R-xg1GovHLyw_8cvzQkge";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================
   STATE
========================================= */

let currentUser = null;
let currentServer = null;
let currentChannel = null;
let realtimeChannel = null;


/* =========================================
   ELEMENTS
========================================= */

const authScreen =
  document.getElementById("auth-screen");

const app =
  document.getElementById("app");

const authMessage =
  document.getElementById("message");

const messagesBox =
  document.getElementById("messages");

const messageForm =
  document.getElementById("message-form");

const messageInput =
  document.getElementById("message-input");


/* =========================================
   REGISTER
========================================= */

window.register = async function () {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (!email || !password) {

    authMessage.textContent =
      "Enter an email and password.";

    return;
  }

  if (password.length < 6) {

    authMessage.textContent =
      "Password must be at least 6 characters.";

    return;
  }

  const {
    data,
    error
  } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {

    authMessage.textContent =
      error.message;

    return;
  }

  if (data.session) {

    await startApp(data.user);

  } else {

    authMessage.textContent =
      "Account created! Check your email to confirm your account.";

  }

};


/* =========================================
   LOGIN
========================================= */

window.login = async function () {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (!email || !password) {

    authMessage.textContent =
      "Enter your email and password.";

    return;
  }

  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    authMessage.textContent =
      error.message;

    return;
  }

  await startApp(data.user);

};


/* =========================================
   LOGOUT
========================================= */

window.logout = async function () {

  if (realtimeChannel) {

    await supabase.removeChannel(
      realtimeChannel
    );

    realtimeChannel = null;

  }

  await supabase.auth.signOut();

  currentUser = null;
  currentServer = null;
  currentChannel = null;

  app.style.display = "none";
  authScreen.style.display = "flex";

};


/* =========================================
   START APPLICATION
========================================= */

async function startApp(user) {

  currentUser = user;

  authScreen.style.display = "none";
  app.style.display = "flex";

  await createProfileIfNeeded();

  await loadProfile();

  await loadServers();

}


/* =========================================
   PROFILE
========================================= */

async function createProfileIfNeeded() {

  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {

    console.error(
      "Profile check failed:",
      error
    );

    return;
  }

  if (!data) {

    const username =
      currentUser.email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 32) ||
      "user";

    await supabase
      .from("profiles")
      .insert({
        id: currentUser.id,
        username,
        display_name: username
      });

  }

}


async function loadProfile() {

  const {
    data,
    error
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {

    console.error(
      "Profile load failed:",
      error
    );

    return;
  }

  if (!data) return;

  const displayName =
    data.display_name ||
    data.username ||
    currentUser.email.split("@")[0];

  setText(
    "user-name",
    displayName
  );

  setText(
    "member-display-name",
    displayName
  );

  setText(
    "menu-username",
    displayName
  );

  setText(
    "menu-email",
    currentUser.email
  );

  setText(
    "settings-email",
    currentUser.email
  );

  const letter =
    displayName.charAt(0).toUpperCase();

  setText(
    "user-avatar",
    letter
  );

  setText(
    "menu-avatar",
    letter
  );

  setText(
    "member-display-name",
    displayName
  );

}


/* =========================================
   LOAD SERVERS
========================================= */

async function loadServers() {

  const {
    data: memberships,
    error
  } = await supabase
    .from("server_members")
    .select(`
      server_id,
      servers (
        id,
        name,
        icon_url,
        owner_id
      )
    `)
    .eq(
      "user_id",
      currentUser.id
    );

  if (error) {

    console.error(
      "Server load failed:",
      error
    );

    return;
  }

  const serverList =
    document.getElementById("server-list");

  serverList.innerHTML = "";

  const servers = [];

  for (const membership of memberships || []) {

    if (!membership.servers) continue;

    servers.push(
      membership.servers
    );

    addServerButton(
      membership.servers
    );

  }

  if (servers.length > 0) {

    await selectServer(
      servers[0]
    );

  } else {

    showHome();

  }

}


/* =========================================
   ADD SERVER BUTTON
========================================= */

function addServerButton(server) {

  const serverList =
    document.getElementById("server-list");

  const button =
    document.createElement("button");

  button.className =
    "server-icon";

  button.title =
    server.name;

  const firstLetter =
    server.name
      .charAt(0)
      .toUpperCase();

  if (server.icon_url) {

    button.style.backgroundImage =
      `url("${server.icon_url}")`;

    button.style.backgroundSize =
      "cover";

    button.textContent = "";

  } else {

    button.textContent =
      firstLetter;

  }

  button.onclick = () => {

    selectServer(server);

  };

  serverList.appendChild(button);

}


/* =========================================
   CREATE SERVER
========================================= */

window.openCreateServer = function () {

  document.getElementById(
    "create-server-modal"
  ).style.display = "flex";

  setTimeout(() => {

    document
      .getElementById("new-server-name")
      .focus();

  }, 50);

};


window.closeCreateServer = function () {

  document.getElementById(
    "create-server-modal"
  ).style.display = "none";

};


window.createServer = async function () {

  const input =
    document.getElementById(
      "new-server-name"
    );

  const name =
    input.value.trim();

  if (!name) {

    alert(
      "Please enter a server name."
    );

    return;
  }

  const {
    data,
    error
  } = await supabase
    .from("servers")
    .insert({
      name,
      owner_id: currentUser.id
    })
    .select()
    .single();

  if (error) {

    console.error(error);

    alert(
      "Could not create the server: " +
      error.message
    );

    return;
  }

  input.value = "";

  closeCreateServer();

  await loadServers();

  await selectServer(data);

};


/* =========================================
   SELECT SERVER
========================================= */

async function selectServer(server) {

  currentServer = server;

  setText(
    "server-name",
    server.name
  );

  const channelList =
    document.getElementById(
      "channel-list"
    );

  channelList.innerHTML = "";

  await loadChannels();

  await loadMembers();

}


/* =========================================
   LOAD CHANNELS
========================================= */

async function loadChannels() {

  if (!currentServer) return;

  const {
    data,
    error
  } = await supabase
    .from("channels")
    .select("*")
    .eq(
      "server_id",
      currentServer.id
    )
    .order(
      "position",
      {
        ascending: true
      }
    );

  if (error) {

    console.error(
      "Channel load failed:",
      error
    );

    return;
  }

  const channelList =
    document.getElementById(
      "channel-list"
    );

  channelList.innerHTML = "";

  const textChannels =
    data.filter(
      channel =>
        channel.type === "text"
    );

  const voiceChannels =
    data.filter(
      channel =>
        channel.type === "voice"
    );

  const categories =
    data.filter(
      channel =>
        channel.type === "category"
    );


  /* HOME NAVIGATION */

  const navigation =
    document.createElement("div");

  navigation.className =
    "home-navigation";

  navigation.innerHTML = `
    <div class="nav-item" id="server-home-button">
      <span class="nav-icon">⌂</span>
      Home
    </div>

    <div class="nav-item">
      <span class="nav-icon">👥</span>
      Members
    </div>
  `;

  navigation
    .querySelector(
      "#server-home-button"
    )
    .onclick = () => {

      if (textChannels.length > 0) {

        selectChannel(
          textChannels[0]
        );

      }

    };

  channelList.appendChild(
    navigation
  );


  /* CATEGORIES */

  for (const category of categories) {

    const categoryElement =
      document.createElement("div");

    categoryElement.className =
      "channel-category";

    categoryElement.innerHTML = `
      <div class="category-title">
        <span>${escapeHtml(category.name.toUpperCase())}</span>
        <button>+</button>
      </div>
    `;

    categoryElement
      .querySelector("button")
      .onclick = () => {

        openCreateChannel("text");

      };

    channelList.appendChild(
      categoryElement
    );

  }


  /* TEXT CHANNELS */

  if (textChannels.length > 0) {

    const category =
      createChannelCategory(
        "TEXT CHANNELS",
        "text"
      );

    for (const channel of textChannels) {

      const item =
        createChannelElement(
          channel,
          "#"
        );

      category.appendChild(item);

    }

    channelList.appendChild(category);

  }


  /* VOICE CHANNELS */

  if (voiceChannels.length > 0) {

    const category =
      createChannelCategory(
        "VOICE CHANNELS",
        "voice"
      );

    for (const channel of voiceChannels) {

      const item =
        createChannelElement(
          channel,
          "🔊"
        );

      category.appendChild(item);

    }

    channelList.appendChild(category);

  }


  /* AUTO SELECT FIRST TEXT CHANNEL */

  if (textChannels.length > 0) {

    await selectChannel(
      textChannels[0]
    );

  }

}


function createChannelCategory(
  title,
  type
) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "channel-category";

  const header =
    document.createElement("div");

  header.className =
    "category-title";

  const titleElement =
    document.createElement("span");

  titleElement.textContent =
    title;

  const addButton =
    document.createElement("button");

  addButton.textContent =
    "+";

  addButton.onclick = () => {

    openCreateChannel(
      type
    );

  };

  header.appendChild(
    titleElement
  );

  header.appendChild(
    addButton
  );

  wrapper.appendChild(
    header
  );

  return wrapper;

}


function createChannelElement(
  channel,
  icon
) {

  const item =
    document.createElement("div");

  item.className =
    "channel-item";

  item.innerHTML = `
    <span>${icon}</span>
    <span></span>
  `;

  item
    .querySelectorAll("span")[1]
    .textContent =
      channel.name;

  item.onclick = () => {

    selectChannel(channel);

  };

  return item;

}


/* =========================================
   SELECT CHANNEL
========================================= */

async function selectChannel(channel) {

  currentChannel = channel;

  setText(
    "current-channel-name",
    channel.name
  );

  setText(
    "current-channel-icon",
    channel.type === "voice"
      ? "🔊"
      : "#"
  );

  messageInput.placeholder =
    channel.type === "voice"
      ? "Voice channels are coming soon..."
      : `Message #${channel.name}`;

  if (channel.type === "voice") {

    messagesBox.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🔊</div>
        <h1>${escapeHtml(channel.name)}</h1>
        <p>Voice channels are being built.</p>
      </div>
    `;

    messageInput.disabled = true;

    return;

  }

  messageInput.disabled = false;

  await loadMessages();

  subscribeToMessages();

}


/* =========================================
   CREATE CHANNEL
========================================= */

window.openCreateChannel =
  function(type = "text") {

    if (!currentServer) {

      alert(
        "Select a server first."
      );

      return;
    }

    const modal =
      document.getElementById(
        "create-channel-modal"
      );

    const typeInput =
      document.getElementById(
        "new-channel-type"
      );

    typeInput.value =
      type === "voice"
        ? "voice"
        : "text";

    document.getElementById(
      "new-channel-name"
    ).value = "";

    modal.style.display =
      "flex";

  };


window.closeCreateChannel =
  function() {

    document.getElementById(
      "create-channel-modal"
    ).style.display =
      "none";

  };


window.createChannel =
  async function() {

    if (!currentServer) return;

    const name =
      document.getElementById(
        "new-channel-name"
      ).value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    const type =
      document.getElementById(
        "new-channel-type"
      ).value;

    if (!name) {

      alert(
        "Please enter a channel name."
      );

      return;
    }

    const {
      data: existing
    } = await supabase
      .from("channels")
      .select("position")
      .eq(
        "server_id",
        currentServer.id
      )
      .order(
        "position",
        {
          ascending: false
        }
      )
      .limit(1);

    const position =
      existing &&
      existing.length
        ? existing[0].position + 1
        : 0;

    const {
      data,
      error
    } = await supabase
      .from("channels")
      .insert({
        server_id:
          currentServer.id,

        name,

        type,

        position
      })
      .select()
      .single();

    if (error) {

      console.error(error);

      alert(
        "Could not create channel: " +
        error.message
      );

      return;
    }

    closeCreateChannel();

    await loadChannels();

    await selectChannel(data);

  };


/* =========================================
   LOAD MEMBERS
========================================= */

async function loadMembers() {

  if (!currentServer) return;

  const {
    data,
    error
  } = await supabase
    .from("server_members")
    .select(`
      user_id,
      profiles (
        username,
        display_name,
        avatar_url,
        status
      )
    `)
    .eq(
      "server_id",
      currentServer.id
    );

  if (error) {

    console.error(
      "Member load failed:",
      error
    );

    return;
  }

  const membersList =
    document.getElementById(
      "members-list"
    );

  membersList.innerHTML = "";

  for (const member of data || []) {

    if (!member.profiles) continue;

    const profile =
      member.profiles;

    const name =
      profile.display_name ||
      profile.username ||
      "User";

    const item =
      document.createElement("div");

    item.className =
      "member-item";

    const avatar =
      document.createElement("div");

    avatar.className =
      "member-avatar";

    avatar.textContent =
      name
        .charAt(0)
        .toUpperCase();

    const info =
      document.createElement("div");

    const strong =
      document.createElement("strong");

    strong.textContent =
      name;

    const status =
      document.createElement("span");

    status.className =
      "member-online";

    status.textContent =
      "● " +
      (profile.status || "online");

    info.appendChild(
      strong
    );

    info.appendChild(
      status
    );

    item.appendChild(
      avatar
    );

    item.appendChild(
      info
    );

    membersList.appendChild(
      item
    );

  }

}


/* =========================================
   LOAD MESSAGES
========================================= */

async function loadMessages() {

  if (!currentChannel) return;

  const {
    data,
    error
  } = await supabase
    .from("messages")
    .select("*")
    .eq(
      "channel_id",
      currentChannel.id
    )
    .order(
      "created_at",
      {
        ascending: true
      }
    );

  if (error) {

    console.error(
      "Message load failed:",
      error
    );

    return;
  }

  messagesBox.innerHTML = "";

  if (!data || data.length === 0) {

    messagesBox.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">#</div>
        <h1>Welcome to #${escapeHtml(currentChannel.name)}!</h1>
        <p>This is the beginning of this channel.</p>
      </div>
    `;

    return;
  }

  data.forEach(
    addMessage
  );

}


/* =========================================
   ADD MESSAGE
========================================= */

function addMessage(message) {

  const element =
    document.createElement("div");

  element.className =
    "message";

  const username =
    document.createElement("strong");

  username.textContent =
    message.username ||
    "User";

  const content =
    document.createElement("p");

  content.textContent =
    message.content;

  element.appendChild(
    username
  );

  element.appendChild(
    content
  );

  messagesBox.appendChild(
    element
  );

  messagesBox.scrollTop =
    messagesBox.scrollHeight;

}


/* =========================================
   SEND MESSAGE
========================================= */

messageForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentUser) return;

    if (!currentChannel) return;

    if (
      currentChannel.type !==
      "text"
    ) return;

    const content =
      messageInput.value.trim();

    if (!content) return;

    const {
      error
    } = await supabase
      .from("messages")
      .insert({
        user_id:
          currentUser.id,

        username:
          currentUser.email,

        content,

        channel_id:
          currentChannel.id
      });

    if (error) {

      console.error(
        "Message send failed:",
        error
      );

      alert(
        "Could not send message: " +
        error.message
      );

      return;
    }

    messageInput.value = "";

  }
);


/* =========================================
   REAL-TIME MESSAGES
========================================= */

function subscribeToMessages() {

  if (!currentChannel) return;

  if (realtimeChannel) {

    supabase.removeChannel(
      realtimeChannel
    );

  }

  realtimeChannel =
    supabase
      .channel(
        "messages-" +
        currentChannel.id
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",

          filter:
            "channel_id=eq." +
            currentChannel.id

        },
        payload => {

          addMessage(
            payload.new
          );

        }
      )
      .subscribe();

}


/* =========================================
   HOME
========================================= */

window.goHome = function() {

  if (currentServer) {

    const channel =
      document.querySelector(
        ".channel-item"
      );

    if (channel) {

      channel.click();

      return;

    }

  }

  showHome();

};


function showHome() {

  currentServer = null;
  currentChannel = null;

  setText(
    "server-name",
    "Home"
  );

  setText(
    "current-channel-name",
    "general"
  );

  setText(
    "current-channel-icon",
    "#"
  );

  messagesBox.innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">D</div>
      <h1>Welcome to Discorda!</h1>
      <p>Select a server to start chatting.</p>
    </div>
  `;

}


/* =========================================
   USER MENU
========================================= */

window.openUserMenu =
  function() {

    const menu =
      document.getElementById(
        "user-menu"
      );

    menu.style.display =
      menu.style.display === "block"
        ? "none"
        : "block";

  };


window.openServerMenu =
  function() {

    if (!currentServer) return;

    alert(
      "Server menu coming next."
    );

  };


/* =========================================
   SETTINGS
========================================= */

window.openSettings =
  function() {

    document.getElementById(
      "user-menu"
    ).style.display =
      "none";

    document.getElementById(
      "settings-screen"
    ).style.display =
      "flex";

  };


window.closeSettings =
  function() {

    document.getElementById(
      "settings-screen"
    ).style.display =
      "none";

  };


window.openProfileSettings =
  function() {

    openSettings();

    showSettingsPage(
      "profile"
    );

  };


window.openAppearance =
  function() {

    openSettings();

    showSettingsPage(
      "appearance"
    );

  };


window.showSettingsPage =
  function(page) {

    const container =
      document.getElementById(
        "settings-page"
      );

    document
      .querySelectorAll(
        ".settings-item"
      )
      .forEach(
        button =>
          button.classList.remove(
            "active"
          )
      );


    if (page === "account") {

      container.innerHTML = `
        <h1>My Account</h1>

        <p>
          Manage your Discorda account.
        </p>

        <div class="settings-card">
          <h3>Email</h3>
          <p>${escapeHtml(currentUser?.email || "")}</p>
        </div>

        <div class="settings-card">
          <h3>Account Security</h3>

          <button onclick="changePassword()">
            Change Password
          </button>
        </div>
      `;

    }


    if (page === "profile") {

      container.innerHTML = `
        <h1>Profile</h1>

        <p>
          Customize how other Discorda users see you.
        </p>

        <div class="settings-card">

          <h3>Display Name</h3>

          <input
            id="profile-display-name"
            type="text"
            placeholder="Display name"
          >

          <button onclick="saveProfile()">
            Save Profile
          </button>

        </div>
      `;

      loadProfileIntoSettings();

    }


    if (page === "appearance") {

      container.innerHTML = `
        <h1>Appearance</h1>

        <p>
          Customize the way Discorda looks.
        </p>

        <div class="settings-card">

          <h3>Theme</h3>

          <button onclick="setTheme('dark')">
            Dark
          </button>

          <button onclick="setTheme('light')">
            Light
          </button>

          <button onclick="setTheme('amoled')">
            AMOLED
          </button>

        </div>
      `;

    }


    if (page === "accessibility") {

      container.innerHTML = `
        <h1>Accessibility</h1>

        <p>
          Adjust Discorda for easier use.
        </p>

        <div class="settings-card">

          <h3>Reduced Motion</h3>

          <button onclick="alert('Reduced motion settings coming next.')">
            Configure
          </button>

        </div>
      `;

    }


    if (page === "notifications") {

      container.innerHTML = `
        <h1>Notifications</h1>

        <p>
          Control your Discorda notifications.
        </p>

        <div class="settings-card">
          <h3>Notifications</h3>
          <p>Notification controls are being connected.</p>
        </div>
      `;

    }


    if (page === "privacy") {

      container.innerHTML = `
        <h1>Privacy & Safety</h1>

        <p>
          Manage your privacy and safety settings.
        </p>

        <div class="settings-card">
          <h3>Privacy</h3>
          <p>Privacy controls will be connected to your account.</p>
        </div>
      `;

    }


    if (page === "connections") {

      container.innerHTML = `
        <h1>Connections</h1>

        <p>
          Connect other accounts to Discorda.
        </p>

        <div class="settings-card">
          <h3>Connected Accounts</h3>
          <p>No connected accounts.</p>
        </div>
      `;

    }


    if (page === "premium") {

      container.innerHTML = `
        <h1>Discorda Premium</h1>

        <p>
          Premium features will be connected later.
        </p>

        <div class="settings-card">
          <h3>Discorda Plus</h3>
          <p>Enhanced profile customization and larger uploads.</p>
          <button onclick="alert('Premium checkout will be added later.')">
            View Plan
          </button>
        </div>

        <div class="settings-card">
          <h3>Discorda Premium</h3>
          <p>More customization and community features.</p>
          <button onclick="alert('Premium checkout will be added later.')">
            View Plan
          </button>
        </div>
      `;

    }

  };


async function loadProfileIntoSettings() {

  const {
    data
  } = await supabase
    .from("profiles")
    .select("*")
    .eq(
      "id",
      currentUser.id
    )
    .maybeSingle();

  if (!data) return;

  const input =
    document.getElementById(
      "profile-display-name"
    );

  if (input) {

    input.value =
      data.display_name ||
      data.username ||
      "";

  }

}


window.saveProfile =
  async function() {

    const input =
      document.getElementById(
        "profile-display-name"
      );

    const displayName =
      input.value.trim();

    if (!displayName) return;

    const {
      error
    } = await supabase
      .from("profiles")
      .update({
        display_name:
          displayName
      })
      .eq(
        "id",
        currentUser.id
      );

    if (error) {

      alert(
        error.message
      );

      return;
    }

    await loadProfile();

    alert(
      "Profile updated!"
    );

  };


window.changePassword =
  async function() {

    const password =
      prompt(
        "Enter your new password:"
      );

    if (!password) return;

    if (password.length < 6) {

      alert(
        "Password must be at least 6 characters."
      );

      return;
    }

    const {
      error
    } = await supabase.auth.updateUser({
      password
    });

    if (error) {

      alert(
        error.message
      );

      return;
    }

    alert(
      "Password updated!"
    );

  };


/* =========================================
   THEME
========================================= */

window.setTheme =
  function(theme) {

    if (theme === "light") {

      document.documentElement.style.setProperty(
        "--background",
        "#f2f3f5"
      );

      document.documentElement.style.setProperty(
        "--background-dark",
        "#e3e5e8"
      );

      document.documentElement.style.setProperty(
        "--sidebar",
        "#ebedef"
      );

      document.documentElement.style.setProperty(
        "--sidebar-dark",
        "#dfe1e5"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#111214"
      );

    }

    else if (theme === "amoled") {

      document.documentElement.style.setProperty(
        "--background",
        "#000000"
      );

      document.documentElement.style.setProperty(
        "--background-dark",
        "#000000"
      );

      document.documentElement.style.setProperty(
        "--sidebar",
        "#050505"
      );

      document.documentElement.style.setProperty(
        "--sidebar-dark",
        "#000000"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#ffffff"
      );

    }

    else {

      document.documentElement.style.setProperty(
        "--background",
        "#1e1f22"
      );

      document.documentElement.style.setProperty(
        "--background-dark",
        "#111214"
      );

      document.documentElement.style.setProperty(
        "--sidebar",
        "#2b2d31"
      );

      document.documentElement.style.setProperty(
        "--sidebar-dark",
        "#232428"
      );

      document.documentElement.style.setProperty(
        "--text",
        "#f2f3f5"
      );

    }

  };


/* =========================================
   EXTRA MENU BUTTONS
========================================= */

window.openFriends =
  function() {

    alert(
      "Friends system coming next."
    );

  };


window.openNotifications =
  function() {

    alert(
      "Notifications coming next."
    );

  };


window.openPins =
  function() {

    alert(
      "Pinned messages coming next."
    );

  };


window.openSearch =
  function() {

    alert(
      "Message search coming next."
    );

  };


window.openAttachmentMenu =
  function() {

    alert(
      "File uploads coming next."
    );

  };


window.openEmojiPicker =
  function() {

    alert(
      "Emoji picker coming next."
    );

  };


/* =========================================
   SESSION
========================================= */

const {
  data: {
    session
  }
} = await supabase.auth.getSession();

if (session) {

  await startApp(
    session.user
  );

}


supabase.auth.onAuthStateChange(
  async (event, session) => {

    if (
      session &&
      !currentUser
    ) {

      await startApp(
        session.user
      );

    }

  }
);


/* =========================================
   HELPERS
========================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value;

  }

}


function escapeHtml(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;

}
// =====================================================
// DISCORDA SERVER SETTINGS
// =====================================================

function openServerSettings() {
    if (!currentServer) {
        alert("Please select a server first.");
        return;
    }

    const existing = document.getElementById("server-settings-screen");
    if (existing) {
        existing.remove();
    }

    const screen = document.createElement("div");
    screen.id = "server-settings-screen";

    screen.innerHTML = `
        <div class="server-settings">

            <div class="server-settings-sidebar">

                <div class="server-settings-title">
                    ${escapeHtml(currentServer.name)}
                </div>

                <div class="server-settings-item active"
                     onclick="showServerSetting('profile')">
                    🖼️ Server Profile
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('tag')">
                    🏷️ Server Tag
                </div>

                <div class="server-settings-section">
                    EXPRESSION
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('emoji')">
                    😀 Emoji
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('stickers')">
                    🖼️ Stickers
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('soundboard')">
                    🔊 Soundboard
                </div>

                <div class="server-settings-section">
                    PEOPLE
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('members')">
                    👥 Members
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('roles')">
                    🎭 Roles
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('invites')">
                    🔗 Invites
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('access')">
                    🔐 Access
                </div>

                <div class="server-settings-section">
                    APPS
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('apps')">
                    🤖 Apps
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('integrations')">
                    🔌 Integrations
                </div>

                <div class="server-settings-section">
                    MODERATION
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('moderation')">
                    🛡️ Moderation
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('safety')">
                    🛡️ Safety Setup
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('audit')">
                    📋 Audit Log
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('bans')">
                    🚫 Bans
                </div>

                <div class="server-settings-section">
                    COMMUNITY
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('community')">
                    🌐 Community Overview
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('onboarding')">
                    👋 Onboarding
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('insights')">
                    📊 Server Insights
                </div>

                <div class="server-settings-item"
                     onclick="showServerSetting('template')">
                    📄 Server Template
                </div>

                <div class="server-settings-delete"
                     onclick="deleteCurrentServer()">
                    🗑️ Delete Server
                </div>

                <div class="server-settings-back"
                     onclick="closeServerSettings()">
                    ← Back to Discorda
                </div>

            </div>

            <div class="server-settings-content" id="server-settings-content">
            </div>

        </div>
    `;

    document.body.appendChild(screen);

    showServerSetting("profile");
}


function closeServerSettings() {
    const screen = document.getElementById("server-settings-screen");

    if (screen) {
        screen.remove();
    }
}


function showServerSetting(section) {

    const content = document.getElementById("server-settings-content");

    if (!content) return;

    document.querySelectorAll(".server-settings-item").forEach(item => {
        item.classList.remove("active");
    });

    const clicked = [...document.querySelectorAll(".server-settings-item")]
        .find(item => item.getAttribute("onclick") === `showServerSetting('${section}')`);

    if (clicked) {
        clicked.classList.add("active");
    }

    const titles = {
        profile: "Server Profile",
        tag: "Server Tag",
        emoji: "Emoji",
        stickers: "Stickers",
        soundboard: "Soundboard",
        members: "Members",
        roles: "Roles",
        invites: "Invites",
        access: "Access",
        apps: "Apps",
        integrations: "Integrations",
        moderation: "Moderation",
        safety: "Safety Setup",
        audit: "Audit Log",
        bans: "Bans",
        community: "Community Overview",
        onboarding: "Onboarding",
        insights: "Server Insights",
        template: "Server Template"
    };

    const descriptions = {
        profile: "Change your server name, icon and basic server information.",
        tag: "Manage your server tag.",
        emoji: "Manage custom emojis for your server.",
        stickers: "Manage custom stickers.",
        soundboard: "Manage sounds available in your server.",
        members: "View and manage server members.",
        roles: "Create and manage server roles and permissions.",
        invites: "Create and manage server invites.",
        access: "Control who can access your server.",
        apps: "Manage apps connected to your server.",
        integrations: "Manage external integrations.",
        moderation: "Configure moderation tools.",
        safety: "Configure server safety settings.",
        audit: "View actions performed by server staff.",
        bans: "Manage banned users.",
        community: "Configure community features.",
        onboarding: "Configure how new members join your server.",
        insights: "View server activity and statistics.",
        template: "Create and manage a server template."
    };

    if (section === "profile") {

        content.innerHTML = `
            <h1>Server Profile</h1>

            <p class="server-settings-description">
                ${descriptions.profile}
            </p>

            <div class="settings-card">

                <label>SERVER NAME</label>

                <input
                    id="server-name-setting"
                    value="${escapeHtml(currentServer.name)}"
                    maxlength="100"
                />

                <button onclick="saveServerName()">
                    Save Changes
                </button>

            </div>

            <div class="settings-card">

                <h2>Server Information</h2>

                <p>
                    Server ID:
                    <code>${currentServer.id}</code>
                </p>

                <p>
                    Owner ID:
                    <code>${currentServer.owner_id}</code>
                </p>

            </div>
        `;

        return;
    }

    content.innerHTML = `
        <h1>${titles[section] || "Server Settings"}</h1>

        <p class="server-settings-description">
            ${descriptions[section] || "Manage this part of your server."}
        </p>

        <div class="settings-card">

            <h2>${titles[section] || "Settings"}</h2>

            <p>
                This section is connected to Discorda's server
                settings system and will be expanded with real
                database functionality.
            </p>

        </div>
    `;
}


async function saveServerName() {

    const input = document.getElementById("server-name-setting");

    if (!input || !currentServer) return;

    const newName = input.value.trim();

    if (!newName) {
        alert("Enter a server name.");
        return;
    }

    const { error } = await supabase
        .from("servers")
        .update({
            name: newName
        })
        .eq("id", currentServer.id)
        .eq("owner_id", currentUser.id);

    if (error) {
        console.error(error);
        alert("Could not update the server: " + error.message);
        return;
    }

    currentServer.name = newName;

    const serverName = document.getElementById("server-name");

    if (serverName) {
        serverName.textContent = newName;
    }

    await loadServers();

    alert("Server name updated!");
}


async function deleteCurrentServer() {

    if (!currentServer) return;

    const confirmation = prompt(
        `Type "${currentServer.name}" to permanently delete this server.`
    );

    if (confirmation !== currentServer.name) {
        return;
    }

    const { error } = await supabase
        .from("servers")
        .delete()
        .eq("id", currentServer.id)
        .eq("owner_id", currentUser.id);

    if (error) {
        console.error(error);
        alert("Could not delete the server: " + error.message);
        return;
    }

    closeServerSettings();

    currentServer = null;

    await loadServers();

    showHome();

    alert("Server deleted.");
}
