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
    display: `${label} Roll:\n🎲 d20: ${d20}\nModifier: ${formatBonus(
      mod
    )}\nTotal: ${total}`,
  };
}
