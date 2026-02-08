export function formatearFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);

  const dia = d.getDate().toString().padStart(2, "0");
  const mes = (d.getMonth() + 1).toString().padStart(2, "0");
  const anio = d.getFullYear();

  const horas = d.getHours().toString().padStart(2, "0");
  const minutos = d.getMinutes().toString().padStart(2, "0");
  const segundos = d.getSeconds().toString().padStart(2, "0");

  return `${dia}/${mes}/${anio}, ${horas}:${minutos}:${segundos}`;
}