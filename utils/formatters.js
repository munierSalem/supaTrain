// utils/formatters.js
export function formatHHMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
}

export function hr(num) {
  return typeof num === "number" && isFinite(num) ? num.toFixed(1) : "—";
}
