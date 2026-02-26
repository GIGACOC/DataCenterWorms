// Firebase Setup
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

// Login/Register Switch
function showRegister() { document.getElementById("loginBox").style.display="none"; document.getElementById("registerBox").style.display="block"; }
function showLogin() { document.getElementById("registerBox").style.display="none"; document.getElementById("loginBox").style.display="block"; }

// Registration
async function register() {
    const username = document.getElementById("regUser").value;
    const password = document.getElementById("regPass").value;
    if (!username || !password) { message.textContent="Bitte alles ausfüllen!"; return; }
    const doc = await db.collection("users").doc(username).get();
    if (doc.exists) { message.textContent="Benutzername existiert schon!"; return; }
    await db.collection("users").doc(username).set({ password: password, coins: 100, role:"user", bannedUntil:null });
    message.textContent="Registrierung erfolgreich!";
    document.getElementById("regUser").value=username; document.getElementById("regPass").value=password;
    login();
}

// Login
async function login() {
    const username = document.getElementById("logUser").value || document.getElementById("regUser").value;
    const password = document.getElementById("logPass").value || document.getElementById("regPass").value;
    const doc = await db.collection("users").doc(username).get();
    if (!doc.exists) { message.textContent="Benutzer nicht gefunden!"; return; }
    const data = doc.data();
    if (data.bannedUntil && data.bannedUntil.toDate() > new Date()) { message.textContent=`Konto gesperrt bis ${data.bannedUntil.toDate().toLocaleString()}`; return; }
    if (data.password !== password) { message.textContent="Falsches Passwort!"; return; }

    window.currentUser=username;
    document.getElementById("loginBox").style.display="none";
    document.getElementById("registerBox").style.display="none";
    document.getElementById("dashboard").style.display="block";
    message.textContent="Login erfolgreich 😎";
    loadCoins(username);

    if (data.role==="admin" || data.role==="owner") document.getElementById("adminPanel").style.display="block";
    if (data.role==="owner") document.getElementById("ownerPanel").style.display="block";

    loadUserTable();
}

// Coins live
function loadCoins(username) {
    db.collection("users").doc(username).onSnapshot(doc=>{ document.getElementById("coins").textContent=doc.data().coins; });
}

// Coins senden
async function sendCoins() {
    const toUser = document.getElementById("sendUser").value;
    const amount = parseInt(document.getElementById("sendAmount").value);
    if (!toUser || !amount) { message.textContent="Fehlende Eingabe!"; return; }
    const fromRef = db.collection("users").doc(window.currentUser);
    const toRef = db.collection("users").doc(toUser);
    const fromDoc = await fromRef.get(); const toDoc = await toRef.get();
    if (!toDoc.exists) { message.textContent="Empfänger existiert nicht!"; return; }
    if (fromDoc.data().coins < amount) { message.textContent="Zu wenig Gitcoins!"; return; }

    await fromRef.update({ coins: fromDoc.data().coins - amount });
    await toRef.update({ coins: toDoc.data().coins + amount });
    message.textContent="Coins gesendet 😎💰";
    animateCoins(); animateTable();
}

// Neon Animationen
function animateCoins() { const coinEl=document.getElementById("coins"); coinEl.classList.add("pop"); setTimeout(()=>{ coinEl.classList.remove("pop"); },500);}
function animateTable() { const tbody=document.querySelector("#userTable tbody"); tbody.classList.add("table-flash"); setTimeout(()=>{ tbody.classList.remove("table-flash"); },300); }

// Admin Coins bearbeiten
async function adminEditCoins() {
    const user=document.getElementById("adminUser").value;
    const amount=parseInt(document.getElementById("adminAmount").value);
    const ref=db.collection("users").doc(user); const doc=await ref.get();
    if (!doc.exists) { message.textContent="User existiert nicht!"; return; }
    let coins=doc.data().coins+amount; if (coins<0) coins=0; await ref.update({ coins });
    message.textContent="Coins geändert 💰"; animateTable();
}

// Admin User sperren
async function adminBanUser() {
    const user=document.getElementById("adminUser").value;
    const duration=document.getElementById("banDuration").value;
    const ref=db.collection("users").doc(user); const doc=await ref.get();
    if (!doc.exists) { message.textContent="User existiert nicht!"; return; }
    const now=new Date(); const amount=parseInt(duration);
    const unit=duration.replace(amount,"").trim(); let ms=0;
    if(unit==="s") ms=amount*1000; if(unit==="m") ms=amount*60*1000; if(unit==="h") ms=amount*60*60*1000; if(unit==="d") ms=amount*24*60*60*1000;
    const bannedUntil=new Date(now.getTime()+ms);
    await ref.update({ bannedUntil: firebase.firestore.Timestamp.fromDate(bannedUntil) });
    message.textContent=`User gesperrt bis ${bannedUntil.toLocaleString()}`;
}

// Admin User löschen
async function adminDeleteUser() { const user=document.getElementById("adminUser").value; await db.collection("users").doc(user).delete(); message.textContent="User gelöscht ❌"; animateTable(); }

// Owner Admin erstellen
async function ownerMakeAdmin() { const user=document.getElementById("adminUser").value; const ref=db.collection("users").doc(user); await ref.update({ role:"admin" }); message.textContent="Neuer Admin erstellt 👑"; animateTable(); }

// User Tabelle Live
function loadUserTable() {
    const tbody=document.querySelector("#userTable tbody");
    tbody.innerHTML="";
    db.collection("users").onSnapshot(snapshot=>{
        tbody.innerHTML="";
        snapshot.forEach(doc=>{
            const data=doc.data();
            const tr=document.createElement("tr");
            tr.innerHTML=`<td>${doc.id}</td><td>${data.coins}</td><td>${data.role}</td><td>${data.bannedUntil && data.bannedUntil.toDate()>new Date()?"Ja":"Nein"}</td>`;
            tbody.appendChild(tr);
        });
    });
}
