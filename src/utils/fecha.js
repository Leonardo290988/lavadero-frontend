export function fechaArgentina(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString("es-AR", {
    hour12: false
  });
}