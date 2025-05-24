import OBR from "@owlbear-rodeo/sdk";
import { fetchCharacterData } from "./characterData.js";

// Format +2 or -1
function formatBonus(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

// Rollable stats
function rollStat(label, mod) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + mod;
  alert(
    `${label} Roll:\n🎲 d20: ${d20}\nModifier: ${formatBonus(
      mod
    )}\nTotal: ${total}`
  );
}

// Get query param
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderSavingThrows(stats) {
  const saveDiv = document.getElementById("savingThrows");
  saveDiv.innerHTML = "";

  const saveOrder = [
    ["str", "dex", "con"],
    ["int", "wis", "cha"],
  ];

  for (const row of saveOrder) {
    for (const abbr of row) {
      const data = stats[abbr];
      const saveMod = formatBonus(data.save);

      const saveBox = document.createElement("div");
      saveBox.className = "stat-box";
      saveBox.title = `Click to roll ${abbr.toUpperCase()} Save`;

      // Proficiency star ONLY for saving throws
      const profStar = data.saveProficiency
        ? `<span class="prof-star">🟊</span>`
        : "";

      saveBox.innerHTML = `
        <div class="score">
          ${profStar}
          ${abbr.toUpperCase()}
        </div>
        <div class="mod">${saveMod}</div>
      `;

      saveBox.addEventListener("click", () =>
        rollStat(`${abbr.toUpperCase()} Save`, data.save)
      );

      saveDiv.appendChild(saveBox);
    }
  }
}

function renderSaveNotes(stats) {
  const notesDiv = document.querySelector(".notes");
  notesDiv.innerHTML = ""; // Clear existing notes

  const abilityLabels = {
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
  };

  for (const [abbr, data] of Object.entries(stats)) {
    if (data.saveAdv?.length) {
      for (const adv of data.saveAdv) {
        const note = document.createElement("p");
        const restriction = adv.restriction ? ` ${adv.restriction}` : "";
        note.textContent = `🛡️ Advantage on ${abilityLabels[abbr]} saves${restriction}`;
        notesDiv.appendChild(note);
      }
    }

    if (data.saveDis?.length) {
      for (const dis of data.saveDis) {
        const note = document.createElement("p");
        const restriction = dis.restriction ? ` ${dis.restriction}` : "";
        note.textContent = `⚠️ Disadvantage on ${abilityLabels[abbr]} saves${restriction}`;
        notesDiv.appendChild(note);
      }
    }
  }
}

// Render abilities (STR, DEX, etc.) — NO proficiency stars here
function renderAbilities(stats) {
  const abilitiesDiv = document.getElementById("abilities");
  abilitiesDiv.innerHTML = "";

  const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];

  for (const abbr of abilityOrder) {
    const data = stats[abbr];
    const box = document.createElement("div");
    box.className = "stat-box";
    box.title = `Click to roll ${abbr.toUpperCase()}`;

    box.innerHTML = `
      <div class="score">${data.score}</div>
      <div class="mod">${formatBonus(data.modifier)}</div>
      <div class="label">${abbr.toUpperCase()}</div>
    `;

    box.addEventListener("click", () =>
      rollStat(abbr.toUpperCase(), data.modifier)
    );

    abilitiesDiv.appendChild(box);
  }
}

// Main init
document.addEventListener("DOMContentLoaded", async () => {
  const charName = getQueryParam("name") || "Unknown";
  const charId = getQueryParam("charId");
  const modalId = getQueryParam("modalId");

  document.getElementById("char-name").textContent = charName;
  document.getElementById("stats").textContent = charId
    ? `Character ID: ${charId}`
    : "No Character ID";

  document.getElementById("closeBtn").addEventListener("click", () => {
    if (modalId) {
      OBR.popover.close(modalId);
    }
  });

  if (!charId) return;

  try {
    const data = await fetchCharacterData(charId);
    if (!data?.stats) {
      document.getElementById("stats").textContent =
        "Failed to load character.";
      return;
    }

    renderAbilities(data.stats);
    renderSavingThrows(data.stats);
    renderSaveNotes(data.stats);

    document.getElementById("stats").style.display = "none";
  } catch (err) {
    console.error(err);
    document.getElementById("stats").textContent = "Error loading character.";
  }
});
