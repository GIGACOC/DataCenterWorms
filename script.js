let input = "";
const correctCode = "12314155";

function press(number) {
    input += number;
    document.getElementById("display").value = input;

    if(input === correctCode) {
        document.getElementById("message").textContent = "Du hast den Code richtig eingegeben!";
    } else {
        document.getElementById("message").textContent = "";
    }
}

function clearDisplay() {
    input = "";
    document.getElementById("display").value = "";
    document.getElementById("message").textContent = "";
}
