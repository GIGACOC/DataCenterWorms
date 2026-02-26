// Firebase Config
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

window.currentUser = null;
const message = document.getElementById("message");

// =====================
// Registrierung
// =====================
async function register() {
    const username = document.getElementById("regUser").value;
    const password = document.getElementById("regPass").value;

    if (!username || !password) { message.textContent="Bitte alles ausfüllen!"; return; }

    const doc = await db.collection("users").doc(username).get();
    if (doc.exists) { message.textContent="Benutzername existiert schon!"; return; }

    await db.collection("users").doc(username).set({
        password: password,
        coins: 100,
        role: "user",
        banned: false
    });

    message.textContent="Registrierung erfolgreich!";
}

// =====================
// Login
// =====================
async function login() {
    const username = document.getElementById("logUser").value;
    const password = document.getElementById("logPass").value;

    const doc = await db.collection("users").doc(username).get();
    if (!doc.exists) { message.textContent="Benutzer nicht gefunden!"; return; }

    const data = doc.data();
    if (data.password !== password) { message.textContent="Falsches Passwort!"; return; }
    if (data.banned) { message.textContent="Konto gesperrt 🔒"; return; }

    message.textContent="Login erfolgreich 😎";
    window.currentUser = username;

    loadCoins(username);

    if (data.role === "admin" || data.role === "owner") { document.getElementById("adminPanel").style.display="block"; }
    if (data.role === "owner") { document.getElementById("ownerPanel").style.display="block"; }

    loadUserTable();
}

// =====================
// Coins Live
// =====================
function loadCoins(username) {
    db.collection("users").doc(username).onSnapshot(doc => {
        document.getElementById("coins").textContent = doc.data().coins;
    });
}

// =====================
// Coins senden
// =====================
async function sendCoins() {
    const toUser = document.getElementById("sendUser").value;
    const amount = parseInt(document.getElementById("sendAmount").value);

    if (!toUser || !amount) { message.textContent="Fehlende Eingabe!"; return; }

    const fromRef = db.collection("users").doc(window.currentUser);
    const toRef = db.collection("users").doc(toUser);

    const fromDoc = await fromRef.get();
    const toDoc = await toRef.get();

    if (!toDoc.exists) { message.textContent="Empfänger existiert nicht!"; return; }
    if (fromDoc.data().coins < amount) { message.textContent="Zu wenig Gitcoins!"; return; }

    await fromRef.update({ coins: fromDoc.data().coins - amount });
    await toRef.update({ coins: toDoc.data().coins + amount });

    message.textContent="Coins gesendet 😎💰";
}

// =====================
// ADMIN / OWNER FUNKTIONEN
// =====================
async function adminGive() {
    await updateCoins("add"); message.textContent="Coins hinzugefügt 👑";
}
async function adminRemoveCoins() { await updateCoins("remove"); message.textContent="Coins abgezogen 💸"; }
async function adminSetCoins() { await updateCoins("set"); message.textContent="Coins gesetzt 🎯"; }

async function updateCoins(action) {
    const user = document.getElementById("adminUser").value;
    const amount = parseInt(document.getElementById("adminAmount").value);
    const ref = db.collection("users").doc(user);
    const doc = await ref.get();
    if (!doc.exists) { message.textContent="User existiert nicht!"; return; }
    let coins = doc.data().coins;
    if (action==="add") coins += amount;
    if (action==="remove") coins -= amount;
    if (action==="set") coins = amount;
    await ref.update({ coins });
}

async function adminDeleteUser() { const user = document.getElementById("adminUser").value; await db.collection("users").doc(user).delete(); message.textContent="User gelöscht ❌"; }
async function adminToggleBan() { const user = document.getElementById("adminUser").value; const ref = db.collection("users").doc(user); const doc = await ref.get(); await ref.update({ banned: !doc.data().banned }); message.textContent="Ban Status geändert 🔒"; }
async function ownerMakeAdmin() { const user = document.getElementById("adminUser").value; const ref = db.collection("users").doc(user); await ref.update({ role: "admin" }); message.textContent="Neuer Admin erstellt 👑"; }

// =====================
// USER TABELLE LIVE
// =====================
function loadUserTable() {
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";
    db.collection("users").onSnapshot(snapshot => {
        tbody.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${doc.id}</td><td>${data.coins}</td><td>${data.role}</td><td>${data.banned ? "Ja" : "Nein"}</td>`;
            tbody.appendChild(tr);
        });
    });
}
