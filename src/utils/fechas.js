export function formatearFechaHoraISO(fechaISO) {
  if (!fechaISO) return "";

  // "2026-02-08T18:07:58.464Z"
  const [fecha, hora] = fechaISO.split("T");
  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year} ${hora.substring(0, 8)}`;
}