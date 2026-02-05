import { useEffect, useState } from "react";

export default function EnviosPendientesRepartidor() {
  const [envios, setEnvios] = useState([]);

  const cargar = async () => {
    const res = await fetch("https://lavadero-backend-production.up.railway.app/envios/pendientes");
    const data = await res.json();
    setEnvios(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const entregar = async (id, forma_pago) => {
    await fetch(`https://lavadero-backend-production.up.railway.app/envios/${id}/entregar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forma_pago })
    });

    cargar();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Repartidor - Envíos</h2>

      {envios.map(e => (
        <div
          key={e.id}
          className="bg-white rounded shadow p-4 mb-3"
        >
          <p><b>Cliente:</b> {e.cliente}</p>
          <p><b>Dirección:</b> {e.direccion}</p>
          <p><b>Orden:</b> #{e.orden_id}</p>

          <div className="flex gap-2 mt-3">
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