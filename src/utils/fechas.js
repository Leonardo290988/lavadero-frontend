export function formatearFecha(fecha) {
  if (!fecha) return "-";

  const date = new Date(fecha);

  return date.toLocaleString("es-AR", {
    hour12: false
  });
}