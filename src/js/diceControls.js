// diceControls.js
const DIE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
const selectedDice = Object.fromEntries(DIE_TYPES.map((d) => [d, 0]));

export function showDiceControls() {
  const container = document.createElement("div");
  container.id = "dice-controls";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "620px",
    right: "20px",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "10px",
    borderRadius: "6px",
    zIndex: 10001,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  });

  DIE_TYPES.forEach((type) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "6px";

    const label = document.createElement("span");
    label.textContent = type.toUpperCase();
    label.style.width = "35px";

    const count = document.createElement("span");
    count.textContent = "0";
    count.style.minWidth = "20px";
    count.style.textAlign = "center";

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => {
      selectedDice[type]++;
      count.textContent = selectedDice[type];
    };

    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.onclick = () => {
      if (selectedDice[type] > 0) selectedDice[type]--;
      count.textContent = selectedDice[type];
    };

    [plus, minus].forEach((btn) => {
      Object.assign(btn.style, {
        width: "24px",
        height: "24px",
        lineHeight: "20px",
        textAlign: "center",
        padding: "0",
        cursor: "pointer",
      });
    });

    row.appendChild(label);
    row.appendChild(minus);
    row.appendChild(count);
    row.appendChild(plus);
    container.appendChild(row);
  });

  // ROLL ALL BUTTON
  const rollBtn = document.createElement("button");
  rollBtn.textContent = "🎲 Roll All";
  rollBtn.style.marginTop = "8px";
  rollBtn.onclick = () => {
    import("./diceOverlay.js").then((mod) => {
      mod.rollDiceBatch({ ...selectedDice });
    });
  };
  container.appendChild(rollBtn);

  document.body.appendChild(container);
}

export function cleanupDiceControls() {
  const el = document.getElementById("dice-controls");
  if (el) document.body.removeChild(el);
}
