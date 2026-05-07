import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function EnviosPendientesRepartidor() {
  const [envios, setEnvios] = useState([]);

  const cargar = async () => {
    const res = await fetch(`${API}/envios/pendientes`);
    const data = await res.json();
    setEnvios(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const entregar = async (id, forma_pago) => {
    await fetch(`${API}/envios/${id}/entregar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forma_pago })
    });

    cargar();
  };

  const enCamino = async (id) => {
    if (!confirm("¿Marcar como 'En camino'? Se notifica al cliente.")) return;
    const res = await fetch(`${API}/envios/${id}/en-camino`, { method: "PUT" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Error marcando en camino");
      return;
    }
    cargar();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Repartidor - Envíos</h2>

      {envios.length === 0 && (
        <p className="text-gray-500">No hay envíos pendientes</p>
      )}

      {envios.map(e => (
        <div
          key={e.id}
          className="bg-white rounded shadow p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold">Envío #{e.id}</p>
            {e.estado === "en_camino" ? (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                🚚 En camino
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">
                ⏳ Pendiente
              </span>
            )}
          </div>

          <p><b>Cliente:</b> {e.cliente}</p>
          <p><b>Dirección:</b> {e.direccion}</p>
          <p><b>Orden:</b> #{e.orden_id}</p>

          <div className="flex gap-2 mt-3 flex-wrap">
            {e.estado === "pendiente" && (
              <button
                onClick={() => enCamino(e.id)}
                className="bg-sky-500 text-white px-4 py-2 rounded"
              >
                🚚 En camino
              </button>
            )}

            <button
              onClick={() => entregar(e.id, "Efectivo")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Efectivo
            </button>

            <button
              onClick={() => entregar(e.id, "Transferencia/MercadoPago")}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              MercadoPago
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
