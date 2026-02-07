export function formatearFecha(fecha) {
  if (!fecha) return "-";

  // fuerza interpretación local SIN UTC
  const [datePart, timePart] = fecha.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart
    .split(":")
    .map(v => parseInt(v, 10));

  const d = new Date(year, month - 1, day, hour, minute, second);

  return d.toLocaleString("es-AR", {
    hour12: false
  });
}