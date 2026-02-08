export function formatearFecha(fecha) {
  if (!fecha || typeof fecha !== "string") return "-";

  // Espera: "YYYY-MM-DD HH:mm:ss"
  const partes = fecha.split(" ");
  if (partes.length !== 2) return fecha;

  const [datePart, timePart] = partes;
  const fechaNums = datePart.split("-");
  const horaNums = timePart.split(":");

  if (fechaNums.length !== 3 || horaNums.length < 2) return fecha;

  const [year, month, day] = fechaNums.map(Number);
  const [hour, minute, second = 0] = horaNums.map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  return date.toLocaleString("es-AR", {
    hour12: false
  });
}