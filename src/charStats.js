import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { fetchCharacterData } from "../characterData.js";

// Format +2 or -1
function formatBonus(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function useQueryParam(name) {
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get(name));
    }
  }, [name]);

  return value;
}

export default function CharacterStats() {
  const charName = useQueryParam("name") || "Unknown";
  const charId = useQueryParam("charId");
  const modalId = useQueryParam("modalId");

  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!charId) return;

    const loadCharacter = async () => {
      try {
        const data = await fetchCharacterData(charId);
        if (!data?.stats) {
          setError("Failed to load character.");
          return;
        }
        setStats(data.stats);
      } catch (err) {
        console.error(err);
        setError("Error loading character.");
      }
    };

    loadCharacter();
  }, [charId]);

  const handleClose = () => {
    if (modalId) {
      OBR.popover.close(modalId);
    }
  };

  if (!charId) return <div>Loading character ID...</div>;
  if (error) return <div>{error}</div>;
  if (!stats) return <div>Loading character data...</div>;

  return (
    <div>
      <h2 id="char-name">{charName}</h2>
      <button id="closeBtn" onClick={handleClose}>
        Close
      </button>

      <div id="abilities">{renderAbilities(stats)}</div>

      <div id="savingThrows">{renderSavingThrows(stats)}</div>

      <div className="notes">{renderSaveNotes(stats)}</div>
    </div>
  );
}

// Render abilities (STR, DEX, etc.)
function renderAbilities(stats) {
  const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];

  return abilityOrder.map((abbr) => {
    const data = stats[abbr];
    return (
      <div key={abbr} className="stat-box">
        <div className="score">{data.score}</div>
        <div className="mod">{formatBonus(data.modifier)}</div>
        <div className="label">{abbr.toUpperCase()}</div>
      </div>
    );
  });
}

function renderSavingThrows(stats) {
  const saveOrder = [
    ["str", "dex", "con"],
    ["int", "wis", "cha"],
  ];

  return saveOrder.flat().map((abbr) => {
    const data = stats[abbr];
    const saveMod = formatBonus(data.save);
    const profMark = data.saveProficiency ? "🟊 " : "";
    return (
      <div key={abbr} className="stat-box">
        <div className="score">
          {profMark}
          {abbr.toUpperCase()}
        </div>
        <div className="mod">{saveMod}</div>
      </div>
    );
  });
}

function renderSaveNotes(stats) {
  const abilityLabels = {
    str: "STR",
    dex: "DEX",
    con: "CON",
    int: "INT",
    wis: "WIS",
    cha: "CHA",
  };

  return Object.entries(stats).flatMap(([abbr, data]) => {
    const notes = [];

    if (data.saveAdv?.length) {
      for (const adv of data.saveAdv) {
        const restriction = adv.restriction ? ` ${adv.restriction}` : "";
        notes.push(
          <p key={`${abbr}-adv-${restriction}`}>
            🛡️ Advantage on {abilityLabels[abbr]} saves{restriction}
          </p>
        );
      }
    }

    if (data.saveDis?.length) {
      for (const dis of data.saveDis) {
        const restriction = dis.restriction ? ` ${dis.restriction}` : "";
        notes.push(
          <p key={`${abbr}-dis-${restriction}`}>
            ⚠️ Disadvantage on {abilityLabels[abbr]} saves{restriction}
          </p>
        );
      }
    }

    return notes;
  });
}
