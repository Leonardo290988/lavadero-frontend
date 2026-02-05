const API_URL = 'https://lavadero-backend-production-e1eb.up.railway.app';
import { fechaArgentina } from "../utils/fecha";
// ==========================
// CREAR ORDEN
// ==========================
export const crearOrden = async (cliente_id, senia = 0) => {

  const res = await fetch(`${API_URL}/ordenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cliente_id: Number(cliente_id),
      estado: 'ingresado',
      fecha_ingreso: fechaArgentina(),
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

// ==========================
// DETALLE DE ORDEN
// ==========================
export const getDetalleOrden = async (id) => {

  const res = await fetch(
    `${API_URL}/ordenes/${id}/detalle`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al obtener detalle");
  }

  return data;
};

// ==========================
// SERVICIOS DE ORDEN
// ==========================
export const getServiciosOrden = async (id) => {

  const res = await fetch(
    `${API_URL}/ordenes/${id}/servicios`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al obtener servicios");
  }

  return data;
};