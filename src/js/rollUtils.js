// rollUtils.js
export function formatBonus(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function rollStat(label, mod) {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + mod;
  return {
    label,
    d20,
    modifier: mod,
    total,
    display: `🎲 d20: <strong>${d20}</strong><br>Modifier: <strong>${formatBonus(
      mod
    )}</strong><br><strong style="font-size: 1.2em;">Total: ${total}</strong>`,
  };
}
