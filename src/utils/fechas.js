export const formatearFechaHoraISO = (fecha) => {
  if (!fecha) return "-";

  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};