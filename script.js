let currentCode = null; // Speichert den aktuellen QR-Code

const qrArea = document.getElementById("qrArea");
const message = document.getElementById("message");
const scannerDiv = document.getElementById("scanner");

document.getElementById("createQR").addEventListener("click", () => {
    // Zufälliger langer Code
    currentCode = Math.floor(Math.random() * 1e12).toString();
    qrArea.innerHTML = ""; // alten QR löschen
    new QRCode(qrArea, {
        text: currentCode,
        width: 200,
        height: 200
    });
    message.textContent = "QR-Code erstellt! Scanne ihn mit deinem Handy.";
    scannerDiv.style.display = "none";
});

document.getElementById("scanQR").addEventListener("click", () => {
    if(!currentCode){
        message.textContent = "Kein gültiger QR-Code vorhanden. Bitte erst erstellen!";
        return;
    }

    qrArea.innerHTML = "";
    scannerDiv.style.display = "block";
    message.textContent = "";

    const html5QrCode = new Html5Qrcode("scanner");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            if(decodedText === currentCode){
                message.textContent = `Glückwunsch! Du hast den QR gefunden. Code: ${decodedText}`;
                currentCode = null; // QR löschen
            } else {
                message.textContent = "Der QR ist schon veraltet!";
            }
            html5QrCode.stop();
            scannerDiv.style.display = "none";
        },
        (errorMessage) => {
            // ignorieren, wenn kein QR erkannt
        }
    ).catch(err => {
        message.textContent = "Fehler beim Zugriff auf Kamera: " + err;
    });
});
