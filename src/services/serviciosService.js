const API_URL = 'https://lavadero-backend-production-e1eb.up.railway.app';

export const getServicios = async () => {
  const res = await fetch(`${API_URL}/servicios`);
  if (!res.ok) throw new Error("Error al obtener servicios");
  return res.json();
};