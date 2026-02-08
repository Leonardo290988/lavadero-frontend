export function formatearFecha(fecha) {
  if (!fecha) return "-";

  // fecha viene como "2026-02-08T00:02:52.000"
  const [date, time] = fecha.split("T");
  const [year, month, day] = date.split("-");
  const [hour, minute, second] = time.split(":");

  return `${day}/${month}/${year}, ${hour}:${minute}:${second.slice(0,2)}`;
}