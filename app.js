import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// PUT YOUR SUPABASE DETAILS HERE

const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ELEMENTS

const authScreen = document.getElementById("auth-screen");
const app = document.getElementById("app");
const message = document.getElementById("message");
const userEmail = document.getElementById("user-email");


// REGISTER

window.register = async function () {

  const email = document.getElementById("email").value;
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


// LOGIN

window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  showApp(data.user);
};


// LOGOUT

window.logout = async function () {

  await supabase.auth.signOut();

  app.style.display = "none";
  authScreen.style.display = "flex";
};


// SHOW APP

function showApp(user) {

  authScreen.style.display = "none";
  app.style.display = "flex";

  userEmail.textContent = user.email;
}


// CHECK LOGIN

const {
  data: {
    session
  }
} = await supabase.auth.getSession();

if (session) {
  showApp(session.user);
}


// AUTH CHANGES

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


// MESSAGES

const messageForm =
  document.getElementById("message-form");

messageForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const input =
    document.getElementById("message-input");

  const text = input.value.trim();

  if (!text) return;

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  const messages =
    document.getElementById("messages");

  const messageElement =
    document.createElement("div");

  messageElement.className = "message";

  messageElement.innerHTML = `
    <strong>${user.email}</strong>
    <p>${text}</p>
  `;

  messages.appendChild(messageElement);

  input.value = "";

});
