export function formatearFechaHora(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}