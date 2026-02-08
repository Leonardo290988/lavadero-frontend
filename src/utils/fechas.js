export function formatearFecha(fecha) {
  if (!fecha) return "-";

  // fecha viene tipo: "2026-02-08 03:24:18"
  const [datePart, timePart] = fecha.split(" ");
  const [year, month, day] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return date.toLocaleString("es-AR", {
    hour12: false
  });
}