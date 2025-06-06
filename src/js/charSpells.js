// src/js/charSpells.js
import { fetchCharacterData } from "./characterData.js";

export async function renderSpells(charId) {
  const spellsContainer = document.getElementById("spells");
  if (!spellsContainer) return;

  const charData = await fetchCharacterData(charId);
  if (!charData || !charData.spells) return;

  const { slots = {}, prepared = [] } = charData.spells;

  // Group and sort spells by level
  const spellsByLevel = {};
  prepared.forEach((spell) => {
    const lvl = spell.level.toString();
    if (!spellsByLevel[lvl]) {
      spellsByLevel[lvl] = [];
    }
    spellsByLevel[lvl].push(spell.name);
  });

  // ✅ Alphabetize spells within each level
  for (const level in spellsByLevel) {
    spellsByLevel[level].sort((a, b) => a.localeCompare(b));
  }

  // Build unified spell data structure
  const spellData = Object.entries(slots).map(([level, slotInfo]) => {
    return {
      level: parseInt(level),
      slotsUsed: slotInfo.used,
      slotsTotal: slotInfo.available,
      spells: spellsByLevel[level] || [],
    };
  });

  // Add cantrips (level 0), which don't use slots
  if (spellsByLevel["0"]) {
    spellData.unshift({
      level: 0,
      slotsUsed: 0,
      slotsTotal: 0,
      spells: spellsByLevel["0"],
    });
  }

  // Clear container and start rendering
  spellsContainer.innerHTML = "";

  const container = document.createElement("div");
  container.classList.add("spells-container");

  const overlay = document.createElement("div");
  overlay.classList.add("dev-overlay");
  container.appendChild(overlay);

  // Render each level block
  spellData.forEach((levelData) => {
    const levelBlock = document.createElement("div");
    levelBlock.classList.add("spell-level-block");

    const header = document.createElement("h3");
    header.textContent =
      levelData.level === 0 ? "Cantrips" : `Level ${levelData.level}`;
    levelBlock.appendChild(header);

    if (levelData.level > 0) {
      const slotRow = document.createElement("div");
      slotRow.classList.add("slot-row");

      for (let i = 0; i < levelData.slotsTotal; i++) {
        const slot = document.createElement("div");
        slot.classList.add("slot-box");
        if (i < levelData.slotsUsed) {
          slot.classList.add("used");
        }
        slotRow.appendChild(slot);
      }

      levelBlock.appendChild(slotRow);
    }

    const spellList = document.createElement("div");
    spellList.classList.add("spell-list");

    if (levelData.spells.length === 0) {
      const empty = document.createElement("div");
      empty.classList.add("spell-list-item");
      empty.textContent = "No spells prepared.";
      spellList.appendChild(empty);
    } else {
      levelData.spells.forEach((spellName) => {
        const spellItem = document.createElement("div");
        spellItem.classList.add("spell-list-item");
        spellItem.textContent = spellName;
        spellList.appendChild(spellItem);
      });
    }

    levelBlock.appendChild(spellList);
    container.appendChild(levelBlock);
  });

  spellsContainer.appendChild(container);
}
