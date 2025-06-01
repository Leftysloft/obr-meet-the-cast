// charSkills.js
import OBR from "@owlbear-rodeo/sdk";
import { rollStat, formatBonus, showRollModeMenu } from "./rollUtils.js";
import { showRollPopover } from "./popoverUtils.js";
import { fetchCharacterData } from "./characterData.js";

const skillGroups = {
  Strength: ["athletics"],
  Dexterity: ["acrobatics", "sleight_of_hand", "stealth"],
  Intelligence: ["arcana", "history", "investigation", "nature", "religion"],
  Wisdom: ["animal_handling", "insight", "medicine", "perception", "survival"],
  Charisma: ["deception", "intimidation", "performance", "persuasion"],
};

const prettyNames = {
  athletics: "Athletics",
  acrobatics: "Acrobatics",
  sleight_of_hand: "Sleight of Hand",
  stealth: "Stealth",
  arcana: "Arcana",
  history: "History",
  investigation: "Investigation",
  nature: "Nature",
  religion: "Religion",
  animal_handling: "Animal Handling",
  insight: "Insight",
  medicine: "Medicine",
  perception: "Perception",
  survival: "Survival",
  deception: "Deception",
  intimidation: "Intimidation",
  performance: "Performance",
  persuasion: "Persuasion",
};

export async function renderSkills(charId) {
  const charData = await fetchCharacterData(charId);
  if (!charData || !charData.skills) return;

  const skillsDiv = document.getElementById("skills");
  skillsDiv.innerHTML = ""; // clear previous skills grid

  const characterName = charData.name || "Unknown";

  // Set the character name in the skills tab header
  const skillCharName = document.querySelector("#tab2 .char-name");
  if (skillCharName) {
    skillCharName.textContent = characterName;
  }

  for (const [ability, skills] of Object.entries(skillGroups)) {
    const groupDiv = document.createElement("div");
    groupDiv.classList.add("skill-group");

    const heading = document.createElement("h4");
    heading.textContent = ability;
    groupDiv.appendChild(heading);

    const skillsGrid = document.createElement("div");
    skillsGrid.classList.add("skills-grid");
    groupDiv.appendChild(skillsGrid);

    for (const skill of skills) {
      const modifier = charData.skills[skill];
      if (modifier === undefined) continue;

      const box = document.createElement("div");
      box.className = "skill-box";
      box.title = `Click to roll ${prettyNames[skill]}`;

      box.innerHTML = `
        <div class="score">${modifier >= 0 ? "+" : ""}${modifier}</div>
        <div class="label">${prettyNames[skill]}</div>
      `;

      box.addEventListener("click", () => {
        const result = rollStat(`${prettyNames[skill]} Check`, modifier);
        showRollPopover(result.label, result.display, characterName);
        OBR.broadcast?.sendMessage?.("rodeo.owlbear.charSkills.rollResult", {
          label: result.label,
          content: result.display,
          name: characterName,
        });
      });

      box.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showRollModeMenu(e.clientX, e.clientY, (mode) => {
          const label = `${prettyNames[skill]} Check${
            mode !== "normal" ? ` (${mode})` : ""
          }`;
          const result = rollStat(label, modifier, mode);
          showRollPopover(result.label, result.display, characterName);
          OBR.broadcast?.sendMessage?.("rodeo.owlbear.charSkills.rollResult", {
            label: result.label,
            content: result.display,
            name: characterName,
          });
        });
      });

      skillsGrid.appendChild(box);
    }

    skillsDiv.appendChild(groupDiv);
  }
}
