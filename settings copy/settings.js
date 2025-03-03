import "../style.css";

//Open Usage Guide window.
const usageGuide = document.getElementById("usageButton");
usageGuide.onclick = () => {
  onclick = window.open(
    "https://github.com/Leftysloft/obr-ext-healthbars/tree/main#readme",
    "mozillaWindow",
    "left=100,top=100,width=600,height=800"
  );
};
