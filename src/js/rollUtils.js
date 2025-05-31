export function formatBonus(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function rollStat(label, mod, mode = "normal") {
  const rollDie = () => Math.floor(Math.random() * 20) + 1;

  let rolls = [rollDie()];
  if (mode === "advantage" || mode === "disadvantage") {
    rolls.push(rollDie());
  }

  const finalRoll =
    mode === "advantage"
      ? Math.max(...rolls)
      : mode === "disadvantage"
      ? Math.min(...rolls)
      : rolls[0];

  const total = finalRoll + mod;
  const rollDisplay =
    mode === "normal"
      ? `🎲 d20: <strong>${finalRoll}</strong><br>`
      : `🎲 d20s: <strong>${rolls.join(
          ", "
        )}</strong><br>Selected: <strong>${finalRoll}</strong><br>`;

  return {
    label,
    d20: finalRoll,
    modifier: mod,
    total,
    display: `${rollDisplay}Modifier: <strong>${formatBonus(
      mod
    )}</strong><br><strong style="font-size: 1.2em;">Total: ${total}</strong>`,
  };
}

export function showRollModeMenu(x, y, callback) {
  const menu = document.createElement("div");
  menu.className = "context-menu";

  menu.innerHTML = `
    <div class="context-item" data-mode="normal">🎲 Normal Roll</div>
    <div class="context-item" data-mode="advantage">🟢 Advantage</div>
    <div class="context-item" data-mode="disadvantage">🔴 Disadvantage</div>
  `;

  document.body.appendChild(menu);

  const offset = 4;
  const { innerWidth, innerHeight } = window;
  const menuRect = menu.getBoundingClientRect();

  let posX = x + offset;
  let posY = y + offset;

  if (posX + menuRect.width > innerWidth) {
    posX = innerWidth - menuRect.width - offset;
  }
  if (posY + menuRect.height > innerHeight) {
    posY = innerHeight - menuRect.height - offset;
  }

  menu.style.position = "absolute";
  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
  menu.style.zIndex = "1000";

  const handleClick = (event) => {
    if (event.target.classList.contains("context-item")) {
      const mode = event.target.dataset.mode;
      callback(mode);
    }
    menu.remove();
    document.removeEventListener("click", handleClick);
  };

  document.addEventListener("click", handleClick);
}
