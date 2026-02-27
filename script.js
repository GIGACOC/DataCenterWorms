// ==========================
// FIREBASE CONFIG
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyDyCMVLe0xc5TyzDOb4xpZpD2wwP77ruDU",
  authDomain: "datacentercoc.firebaseapp.com",
  projectId: "datacentercoc",
  storageBucket: "datacentercoc.firebasestorage.app",
  messagingSenderId: "501916869918",
  appId: "1:501916869918:web:d1eda1d739c921d934550f",
  measurementId: "G-7Q13KCZ02J"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = null;
const message = document.getElementById("message");

// ==========================
// LOGIN / REGISTER SWITCH
// ==========================
function showRegister() {
  loginBox.style.display = "none";
  registerBox.style.display = "block";
}

function showLogin() {
  registerBox.style.display = "none";
  loginBox.style.display = "block";
}

// ==========================
// REGISTER
// ==========================
async function register() {
  const user = regUser.value.trim();
  const pass = regPass.value.trim();

  if (!user || !pass) {
    message.textContent = "Bitte alles ausfüllen!";
    return;
  }

  const doc = await db.collection("users").doc(user).get();
  if (doc.exists) {
    message.textContent = "Benutzer existiert schon!";
    return;
  }

  await db.collection("users").doc(user).set({
    password: pass,
    coins: 100,
    role: "user",
    bannedUntil: null,
    messages: [],
    transactions: []
  });

  login();
}

// ==========================
// LOGIN
// ==========================
async function login() {
  const user = logUser.value || regUser.value;
  const pass = logPass.value || regPass.value;

  const doc = await db.collection("users").doc(user).get();

  if (!doc.exists) {
    message.textContent = "Benutzer nicht gefunden!";
    return;
  }

  const data = doc.data();

  if (data.password !== pass) {
    message.textContent = "Falsches Passwort!";
    return;
  }

  if (data.bannedUntil && data.bannedUntil.toDate() > new Date()) {
    message.textContent = "Konto ist gesperrt!";
    return;
  }

  currentUser = user;

  currentUserSpan = document.getElementById("currentUser");
  currentUserSpan.textContent = user;

  loginBox.style.display = "none";
  registerBox.style.display = "none";
  dashboard.style.display = "block";

  loadCoins();
  loadUserTable();
  loadTxHistory();
  loadInbox();
  fillUserDropdown();

  if (data.role === "admin" || data.role === "owner") {
    adminPanel.style.display = "block";
  }

  if (data.role === "owner") {
    ownerPanel.style.display = "block";
  }

  message.textContent = "Login erfolgreich 😎";
}

// ==========================
// LIVE COINS
// ==========================
function loadCoins() {
  db.collection("users").doc(currentUser)
    .onSnapshot(doc => {
      coins.textContent = doc.data().coins;
    });
}

// ==========================
// SEND COINS + HISTORY
// ==========================
async function sendCoins() {
  const to = sendUser.value.trim();
  const amount = parseInt(sendAmount.value);

  if (!to || !amount || amount <= 0) {
    message.textContent = "Ungültige Eingabe!";
    return;
  }

  const fromRef = db.collection("users").doc(currentUser);
  const toRef = db.collection("users").doc(to);

  const fromDoc = await fromRef.get();
  const toDoc = await toRef.get();

  if (!toDoc.exists) {
    message.textContent = "Empfänger existiert nicht!";
    return;
  }

  if (fromDoc.data().coins < amount) {
    message.textContent = "Zu wenig Gitcoins!";
    return;
  }

  await fromRef.update({
    coins: fromDoc.data().coins - amount,
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "sent",
      to: to,
      amount: amount,
      date: new Date()
    })
  });

  await toRef.update({
    coins: toDoc.data().coins + amount,
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "received",
      from: currentUser,
      amount: amount,
      date: new Date()
    })
  });

  loadTxHistory();
  message.textContent = "Coins gesendet 💰";
}

// ==========================
// TRANSACTION HISTORY
// ==========================
function loadTxHistory() {
  db.collection("users").doc(currentUser)
    .onSnapshot(doc => {

      txHistory.innerHTML = "";
      const txs = doc.data().transactions || [];

      txs.slice().reverse().forEach(tx => {
        const div = document.createElement("div");

        if (tx.type === "sent") {
          div.textContent = `An ${tx.to} -${tx.amount}`;
        } else {
          div.textContent = `Von ${tx.from} +${tx.amount}`;
        }

        txHistory.appendChild(div);
      });
    });
}

// ==========================
// USER TABLE (ALLES ANZEIGEN)
// ==========================
function loadUserTable() {
  db.collection("users").onSnapshot(snapshot => {

    userTable.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${doc.id}</td>
        <td>${data.coins || 0}</td>
        <td>${data.role || "user"}</td>
        <td>${data.bannedUntil ? "Ja" : "Nein"}</td>
      `;

      userTable.appendChild(tr);
    });
  });
}

// ==========================
// ADMIN COINS EDIT
// ==========================
async function adminEditCoins() {
  const user = adminUser.value.trim();
  const amount = parseInt(adminAmount.value);

  const ref = db.collection("users").doc(user);
  const doc = await ref.get();

  if (!doc.exists) return;

  await ref.update({
    coins: doc.data().coins + amount
  });
}

// ==========================
// OWNER MAKE ADMIN
// ==========================
async function ownerMakeAdmin() {
  const user = newAdminUser.value.trim();

  await db.collection("users").doc(user).update({
    role: "admin"
  });
}

// ==========================
// MESSAGES
// ==========================
function openMessagePanel() {
  dashboard.style.display = "none";
  messagePanel.style.display = "block";
}

function closeMessagePanel() {
  messagePanel.style.display = "none";
  dashboard.style.display = "block";
}

function fillUserDropdown() {
  msgUserSelect.innerHTML = "";

  db.collection("users").get().then(snapshot => {
    snapshot.forEach(doc => {
      if (doc.id !== currentUser) {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.id;
        msgUserSelect.appendChild(option);
      }
    });
  });
}

async function sendMessage() {
  const to = msgUserSelect.value;
  const text = msgText.value.trim();

  if (!to || !text) return;

  await db.collection("users").doc(to).update({
    messages: firebase.firestore.FieldValue.arrayUnion({
      from: currentUser,
      text: text
    })
  });

  msgText.value = "";
}

// ==========================
// INBOX + DELETE
// ==========================
function loadInbox() {
  db.collection("users").doc(currentUser)
    .onSnapshot(doc => {

      inbox.innerHTML = "";
      const msgs = doc.data().messages || [];

      msgs.forEach((msg, index) => {

        const div = document.createElement("div");
        div.innerHTML = `
          ${msg.from}: ${msg.text}
          <button onclick="deleteMsg(${index})">X</button>
        `;

        inbox.appendChild(div);
      });
    });
}

async function deleteMsg(index) {
  const ref = db.collection("users").doc(currentUser);
  const doc = await ref.get();

  const msgs = doc.data().messages;
  msgs.splice(index, 1);

  await ref.update({ messages: msgs });
}
