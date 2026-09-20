import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ggrnhhzurugjkgybrpgq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OkgTPJcSX8R-xg1GovHLyw_8cvzQkge";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const authScreen = document.getElementById("auth-screen");
const app = document.getElementById("app");
const message = document.getElementById("message");
const userEmail = document.getElementById("user-email");
const messagesBox = document.getElementById("messages");
const messageForm = document.getElementById("message-form");


// --------------------
// REGISTER
// --------------------

window.register = async function () {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    message.textContent = "Enter an email and password.";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  message.textContent =
    "Account created! Check your email to confirm your account.";
};


// --------------------
// LOGIN
// --------------------

window.login = async function () {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    message.textContent = error.message;
    return;
  }

  showApp(data.user);
};


// --------------------
// LOGOUT
// --------------------

window.logout = async function () {

  await supabase.auth.signOut();

  app.style.display = "none";
  authScreen.style.display = "flex";
};


// --------------------
// SHOW APP
// --------------------

async function showApp(user) {

  authScreen.style.display = "none";
  app.style.display = "flex";

  userEmail.textContent = user.email;

  await loadMessages();
}


// --------------------
// LOAD MESSAGES
// --------------------

async function loadMessages() {

  const {
    data,
    error
  } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", {
      ascending: true
    });

  if (error) {
    console.error(error);
    return;
  }

  messagesBox.innerHTML = `
    <div class="welcome">
      <h2>Welcome to Discorda!</h2>
      <p>This is your first real Discorda server.</p>
    </div>
  `;

  data.forEach(addMessage);
}


// --------------------
// ADD MESSAGE TO SCREEN
// --------------------

function addMessage(msg) {

  const messageElement =
    document.createElement("div");

  messageElement.className = "message";

  const strong =
    document.createElement("strong");

  strong.textContent = msg.username;

  const text =
    document.createElement("p");

  text.textContent = msg.content;

  messageElement.appendChild(strong);
  messageElement.appendChild(text);

  messagesBox.appendChild(messageElement);

  messagesBox.scrollTop =
    messagesBox.scrollHeight;
}


// --------------------
// SEND MESSAGE
// --------------------

messageForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const input =
      document.getElementById("message-input");

    const text =
      input.value.trim();

    if (!text) return;

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    if (!user) return;

    const {
      error
    } = await supabase
      .from("messages")
      .insert({
        user_id: user.id,
        username: user.email,
        content: text
      });

    if (error) {
      console.error(error);
      return;
    }

    input.value = "";
  }
);


// --------------------
// REAL-TIME MESSAGES
// --------------------

supabase
  .channel("discorda-messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    payload => {

      addMessage(payload.new);

    }
  )
  .subscribe();


// --------------------
// CHECK EXISTING LOGIN
// --------------------

const {
  data: {
    session
  }
} = await supabase.auth.getSession();

if (session) {
  showApp(session.user);
}


// --------------------
// AUTH STATE
// --------------------

supabase.auth.onAuthStateChange(
  (event, session) => {

    if (session) {
      showApp(session.user);
    } else {

      app.style.display = "none";
      authScreen.style.display = "flex";

    }

  }
);
