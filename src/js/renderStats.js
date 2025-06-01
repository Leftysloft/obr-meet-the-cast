import OBR from "@owlbear-rodeo/sdk";
import { rollStat, formatBonus, showRollModeMenu } from "./rollUtils.js";
import { showRollPopover } from "./popoverUtils.js";

const fullAbilityNames = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export function renderSavingThrows(stats, name) {
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
      <div class="score">${data.score} ${profStar}</div>
      <div class="mod">${formatBonus(data.save)}</div>
      <div class="label">${abbr.toUpperCase()} Save</div>
    `;

    box.addEventListener("click", () => {
      const result = rollStat(`${fullAbilityNames[abbr]} Save`, data.save);
      showRollPopover(result.label, result.display, name);
      OBR.broadcast?.sendMessage?.("rodeo.owlbear.charStats.rollResult", {
        label: result.label,
        content: result.display,
        name,
      });
    });

    box.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showRollModeMenu(e.clientX, e.clientY, (mode) => {
        const label = `${fullAbilityNames[abbr]} Save${
          mode !== "normal" ? ` (${mode})` : ""
        }`;
        const result = rollStat(label, data.save, mode);
        showRollPopover(result.label, result.display, name);
        OBR.broadcast?.sendMessage?.("rodeo.owlbear.charStats.rollResult", {
          label: result.label,
          content: result.display,
          name,
        });
      });
    });

    saveDiv.appendChild(box);
  }
}

export function renderAbilities(stats, name) {
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
      const result = rollStat(`${fullAbilityNames[abbr]} Check`, data.modifier);
      showRollPopover(result.label, result.display, name);
      OBR.broadcast?.sendMessage?.("rodeo.owlbear.charStats.rollResult", {
        label: result.label,
        content: result.display,
        name,
      });
    });

    box.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showRollModeMenu(e.clientX, e.clientY, (mode) => {
        const label = `${fullAbilityNames[abbr]} Check${
          mode !== "normal" ? ` (${mode})` : ""
        }`;
        const result = rollStat(label, data.modifier, mode);
        showRollPopover(result.label, result.display, name);
        OBR.broadcast?.sendMessage?.("rodeo.owlbear.charStats.rollResult", {
          label: result.label,
          content: result.display,
          name,
        });
      });
    });

    abilitiesDiv.appendChild(box);
  }
}

export function renderSaveNotes(stats) {
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
