// src/js/charSpells.js

export async function renderSpells(characterId) {
  const spellsContainer = document.getElementById("spells");
  if (!spellsContainer) return;

  // Sample data – you'll eventually replace this with actual character data
  const spellData = [
    {
      level: 1,
      slotsUsed: 2,
      slotsTotal: 4,
      spells: ["Magic Missile", "Shield"],
    },
    {
      level: 2,
      slotsUsed: 1,
      slotsTotal: 3,
      spells: ["Misty Step"],
    },
    {
      level: 3,
      slotsUsed: 0,
      slotsTotal: 2,
      spells: [],
    },
  ];

  spellsContainer.innerHTML = ""; // Clear previous content

  const container = document.createElement("div");
  container.classList.add("spells-container");

  const overlay = document.createElement("div");
  overlay.classList.add("dev-overlay");
  overlay.innerHTML = `<div>Under<br>Development</div>`;
  container.appendChild(overlay);

  spellData.forEach((levelData) => {
    const levelBlock = document.createElement("div");
    levelBlock.classList.add("spell-level-block");

    // Header
    const header = document.createElement("h3");
    header.textContent = `Level ${levelData.level}`;
    levelBlock.appendChild(header);

    // Slots
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

    // Spell list
    const spellList = document.createElement("div");
    spellList.classList.add("spell-list");

    if (levelData.spells.length === 0) {
      const empty = document.createElement("div");
      empty.classList.add("spell-list-item");
      empty.textContent = "No spells prepared.";
      spellList.appendChild(empty);
    } else {
      levelData.spells.forEach((spell) => {
        const spellItem = document.createElement("div");
        spellItem.classList.add("spell-list-item");
        spellItem.textContent = spell;
        spellList.appendChild(spellItem);
      });
    }

    levelBlock.appendChild(spellList);
    container.appendChild(levelBlock);
  });

  spellsContainer.appendChild(container);
}
