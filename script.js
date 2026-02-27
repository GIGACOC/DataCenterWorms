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

let currentUser = null;

// LOGIN
function login() {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Bitte alles eingeben!");
    return;
  }

  db.collection("users").doc(username).get().then(doc => {

    if (!doc.exists) {
      alert("Benutzer existiert nicht!");
      return;
    }

    const data = doc.data();

    if (data.password !== password) {
      alert("Falsches Passwort!");
      return;
    }

    // Erfolgreich
    currentUser = username;

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";

    document.getElementById("userDisplay").innerText = username;
    document.getElementById("coins").innerText = data.gitcoins || 0;

  }).catch(error => {
    console.error(error);
    alert("Fehler beim Login!");
  });
}

// LOGOUT
function logout() {
  currentUser = null;
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("panel").style.display = "none";
}
