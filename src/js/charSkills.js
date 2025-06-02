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

    const heading = document.createElement("h3");
    heading.textContent = ability;
    groupDiv.appendChild(heading);

    const skillsGrid = document.createElement("div");

    // Custom layout for Strength group
    if (ability === "Strength") {
      skillsGrid.classList.add("skills-grid"); // still use class, but will override CSS later
      skillsGrid.style.gridTemplateColumns = "1fr 2fr"; // 2-column custom layout
      groupDiv.appendChild(skillsGrid);

      const athletics = skills[0];
      const skillData = charData.skills[athletics];
      if (skillData) {
        const { modifier, adv, dis, prof = 1 } = skillData;

        const box = document.createElement("div");
        box.className = "skill-box";

        if (adv) box.classList.add("advantage");
        else if (dis) box.classList.add("disadvantage");

        box.title = `Click to roll ${prettyNames[athletics]}`;

        const profCircle = document.createElement("div");
        profCircle.classList.add("prof-circle");
        switch (prof) {
          case 2:
            profCircle.classList.add("prof-half");
            break;
          case 3:
            profCircle.classList.add("prof-full");
            break;
          case 4:
            profCircle.classList.add("prof-expert");
            break;
          default:
            profCircle.classList.add("prof-none");
        }

        box.innerHTML = `
        <div class="score-wrapper">
          ${profCircle.outerHTML}
          <div class="score">
            ${modifier >= 0 ? "+" : ""}${modifier}
          </div>
        </div>
        <div class="label">${prettyNames[athletics]}</div>
      `;

        box.addEventListener("click", () => {
          const result = rollStat(`${prettyNames[athletics]} Check`, modifier);
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
            const label = `${prettyNames[athletics]} Check${
              mode !== "normal" ? ` (${mode})` : ""
            }`;
            const result = rollStat(label, modifier, mode);
            showRollPopover(result.label, result.display, characterName);
            OBR.broadcast?.sendMessage?.(
              "rodeo.owlbear.charSkills.rollResult",
              {
                label: result.label,
                content: result.display,
                name: characterName,
              }
            );
          });
        });

        skillsGrid.appendChild(box);
      }

      // Custom map key box
      const mapKeyBox = document.createElement("div");
      mapKeyBox.className = "skill-box";
      mapKeyBox.innerHTML = `
    <div class="prof-key">
      <div><span class="prof-circle prof-none"></span> No Proficiency</div>
      <div><span class="prof-circle prof-half"></span> Half Proficiency</div>
      <div><span class="prof-circle prof-full"></span> Proficient</div>
      <div><span class="prof-circle prof-expert"></span> Expertise</div>
    </div>
    `;
      skillsGrid.appendChild(mapKeyBox);
    } else {
      // Default layout for other abilities
      skillsGrid.classList.add("skills-grid");
      groupDiv.appendChild(skillsGrid);

      for (const skill of skills) {
        const skillData = charData.skills[skill];
        if (!skillData) continue;

        const { modifier, adv, dis, prof = 1 } = skillData;

        const box = document.createElement("div");
        box.className = "skill-box";

        if (adv) box.classList.add("advantage");
        else if (dis) box.classList.add("disadvantage");

        box.title = `Click to roll ${prettyNames[skill]}`;

        const profCircle = document.createElement("div");
        profCircle.classList.add("prof-circle");
        switch (prof) {
          case 2:
            profCircle.classList.add("prof-half");
            break;
          case 3:
            profCircle.classList.add("prof-full");
            break;
          case 4:
            profCircle.classList.add("prof-expert");
            break;
          default:
            profCircle.classList.add("prof-none");
        }

        box.innerHTML = `
        <div class="score-wrapper">
          ${profCircle.outerHTML}
          <div class="score">
            ${modifier >= 0 ? "+" : ""}${modifier}
          </div>
        </div>
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
            OBR.broadcast?.sendMessage?.(
              "rodeo.owlbear.charSkills.rollResult",
              {
                label: result.label,
                content: result.display,
                name: characterName,
              }
            );
          });
        });

        skillsGrid.appendChild(box);
      }
    }

    skillsDiv.appendChild(groupDiv);
  }
}
