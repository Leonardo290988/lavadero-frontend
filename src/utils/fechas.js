export function formatearFechaHora(fecha) {
  if (!fecha) return "";

  const d = new Date(fecha);

  return d.toLocaleString("es-AR", {
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires"
  });
}
