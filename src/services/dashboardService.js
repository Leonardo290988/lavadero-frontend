export async function getDashboard() {
  const response = await fetch('https://lavadero-backend-production-e1eb.up.railway.app/api/dashboard');

  if (!response.ok) {
    throw new Error('Error al obtener dashboard');
  }

  return response.json();
}