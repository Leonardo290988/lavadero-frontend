const API_URL = 'https://lavadero-backend-production-e1eb.up.railway.app';

export const crearOrden = async (cliente_id, senia = 0) => {

  const res = await fetch(`${API_URL}/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_id,
      estado: 'ingresado',
      fecha_ingreso: new Date(),
      fecha_retiro: null,
      senia: Number(senia)
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al crear orden");
  }

  return data;
};