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

// LOGIN / REGISTER SWITCH
function showRegister(){ document.getElementById("loginBox").style.display="none"; document.getElementById("registerBox").style.display="block"; }
function showLogin(){ document.getElementById("registerBox").style.display="none"; document.getElementById("loginBox").style.display="block"; }

// REGISTRIERUNG
async function register(){
    const username=document.getElementById("regUser").value;
    const password=document.getElementById("regPass").value;
    if(!username || !password){ message.textContent="Bitte alles ausfüllen!"; return; }
    const doc=await db.collection("users").doc(username).get();
    if(doc.exists){ message.textContent="Benutzername existiert schon!"; return; }
    await db.collection("users").doc(username).set({ password, coins:100, role:"user", bannedUntil:null, messages:[], transactions:[] });
    document.getElementById("regUser").value=username; document.getElementById("regPass").value=password;
    login();
}

// LOGIN
async function login(){
    const username=document.getElementById("logUser").value||document.getElementById("regUser").value;
    const password=document.getElementById("logPass").value||document.getElementById("regPass").value;
    const doc=await db.collection("users").doc(username).get();
    if(!doc.exists){ message.textContent="Benutzer nicht gefunden!"; return; }
    const data=doc.data();
    if(data.bannedUntil && data.bannedUntil.toDate()>new Date()){ message.textContent=`Konto gesperrt bis ${data.bannedUntil.toDate().toLocaleString()}`; return; }
    if(data.password!==password){ message.textContent="Falsches Passwort!"; return; }

    window.currentUser=username;
    document.getElementById("currentUser").textContent=username;
    document.getElementById("loginBox").style.display="none";
    document.getElementById("registerBox").style.display="none";
    document.getElementById("dashboard").style.display="block";
    message.textContent="Login erfolgreich 😎";

    loadCoins(username);
    if(data.role==="admin"||data.role==="owner") document.getElementById("adminPanel").style.display="block";
    if(data.role==="owner") document.getElementById("ownerPanel").style.display="block";
    loadUserTable();
    loadTxHistory();
}

// Coins live
function loadCoins(username){ db.collection("users").doc(username).onSnapshot(doc=>{ document.getElementById("coins").textContent=doc.data().coins; }); }

// Coins senden mit History
async function sendCoins(){
    const toUser=document.getElementById("sendUser").value;
    const amount=parseInt(document.getElementById("sendAmount").value);
    if(!toUser||!amount){ message.textContent="Fehlende Eingabe!"; return; }
    const fromRef=db.collection("users").doc(window.currentUser);
    const toRef=db.collection("users").doc(toUser);
    const fromDoc=await fromRef.get(); const toDoc=await toRef.get();
    if(!toDoc.exists){ message.textContent="Empfänger existiert nicht!"; return; }
    if(fromDoc.data().coins<amount){ message.textContent="Zu wenig Gitcoins!"; return; }
    // Coins abziehen
    await fromRef.update({ coins: fromDoc.data().coins-amount, transactions: firebase.firestore.FieldValue.arrayUnion({ type:"sent", to:toUser, amount, date:new Date() }) });
    await toRef.update({ coins: toDoc.data().coins+amount, transactions: firebase.firestore.FieldValue.arrayUnion({ type:"received", from:window.currentUser, amount, date:new Date() }) });
    message.textContent="Coins gesendet 😎💰"; animateCoins(); animateTable();
    loadTxHistory();
}

// Transaktions-History anzeigen
function loadTxHistory(){
    const txDiv=document.getElementById("txHistory");
    db.collection("users").doc(window.currentUser).onSnapshot(doc=>{
        txDiv.innerHTML="";
        const txs=doc.data().transactions||[];
        txs.sort((a,b)=>new Date(b.date)-new Date(a.date));
        txs.forEach(tx=>{
            let text="";
            const date=new Date(tx.date.seconds*1000).toLocaleString();
            if(tx.type==="sent") text=`An ${tx.to}: -${tx.amount} GC [${date}]`;
            if(tx.type==="received") text=`Von ${tx.from}: +${tx.amount} GC [${date}]`;
            const div=document.createElement("div"); div.textContent=text; txDiv.appendChild(div);
        });
    });
}
