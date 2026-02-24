let currentCode = null; // aktueller QR-Code
let qrInstance = null;

const qrArea = document.getElementById("qrArea");
const message = document.getElementById("message");
const scannerDiv = document.getElementById("scanner");

document.getElementById("createQR").addEventListener("click", () => {
    // Zufälliger langer Code
    currentCode = Math.floor(Math.random() * 1e12).toString();
    qrArea.innerHTML = "";
    qrInstance = new QRCode(qrArea, {
        text: currentCode,
        width: 200,
        height: 200
    });
    message.textContent = "QR-Code erstellt! Jetzt kannst du ihn herunterladen oder scannen.";
    scannerDiv.style.display = "none";
});

// QR-Code als PNG herunterladen
document.getElementById("downloadQR").addEventListener("click", () => {
    if(!qrArea.querySelector("img")) {
        message.textContent = "Erstelle zuerst einen QR-Code!";
        return;
    }
    const img = qrArea.querySelector("img").src;
    const link = document.createElement("a");
    link.href = img;
    link.download = "qr-code.png";
    link.click();
    message.textContent = "QR-Code heruntergeladen!";
});

// QR-Code scannen
document.getElementById("scanQR").addEventListener("click", () => {
    scannerDiv.style.display = "block";
    qrArea.innerHTML = "";
    message.textContent = "";

    const html5QrCode = new Html5Qrcode("scanner");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            message.textContent = `Glückwunsch! Du hast den QR gefunden. Code: ${decodedText}`;
            html5QrCode.stop();
            scannerDiv.style.display = "none";
        },
        (errorMessage) => {
            // ignorieren
        }
    ).catch(err => {
        message.textContent = "Fehler beim Zugriff auf Kamera: " + err;
    });
});
