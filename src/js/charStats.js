//charStats.js
import OBR from "@owlbear-rodeo/sdk";
import { fetchCharacterData } from "./characterData.js";
import { rollStat, formatBonus } from "./rollUtils.js"; // ✅ Import both

// Get query param
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function renderSavingThrows(stats) {
  const saveDiv = document.getElementById("savingThrows");
  saveDiv.innerHTML = "";

  const saveOrder = ["str", "dex", "con", "int", "wis", "cha"];

  for (const abbr of saveOrder) {
    const data = stats[abbr];
    const box = document.createElement("div");
    box.className = "stat-box";
    box.title = `Click to roll ${abbr.toUpperCase()} Save`;

    const profStar = data.saveProficiency
      ? `<span class="prof-star">🟊</span>`
      : "";

    box.innerHTML = `
      <div class="score">
        ${data.score} ${profStar}
      </div>
      <div class="mod">${formatBonus(data.save)}</div>
      <div class="label">${abbr.toUpperCase()} Save</div>
    `;

    box.addEventListener("click", () => {
      const result = rollStat(`${abbr.toUpperCase()} Save`, data.save);
      showRollPopover(result.label, result.display);
    });

    saveDiv.appendChild(box);
  }
}

function showRollPopover(label, content) {
  OBR.popover.open({
    id: `roll-result-${Date.now()}`,
    url: `/rollResult.html?label=${encodeURIComponent(
      label
    )}&content=${encodeURIComponent(content)}`,
    height: 150,
    width: 250,
    anchorPosition: {
      top: 200, // <- World coordinates, adjust as needed
      left: 300,
    },
    anchorReference: "POSITION",
    anchorOrigin: {
      horizontal: "CENTER",
      vertical: "TOP",
    },
    transformOrigin: {
      horizontal: "CENTER",
      vertical: "TOP",
    },
    hidePaper: false,
  });
}

function renderSaveNotes(stats) {
  const notesDiv = document.querySelector(".notes");
  notesDiv.innerHTML = "";

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
        const restriction = adv.restriction ? ` ${adv.restriction}` : "";
        const note = document.createElement("p");
        note.textContent = `🛡️ Advantage on ${abilityLabels[abbr]} saves${restriction}`;
        notesDiv.appendChild(note);
      }
    }

    if (data.saveDis?.length) {
      for (const dis of data.saveDis) {
        const restriction = dis.restriction ? ` ${dis.restriction}` : "";
        const note = document.createElement("p");
        note.textContent = `⚠️ Disadvantage on ${abilityLabels[abbr]} saves${restriction}`;
        notesDiv.appendChild(note);
      }
    }
  }
}

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

    box.addEventListener("click", () => {
      const result = rollStat(abbr.toUpperCase(), data.modifier);
      showRollPopover(result.label, result.display);
    });

    abilitiesDiv.appendChild(box);
  }
}

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
