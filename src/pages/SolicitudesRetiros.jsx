import { useEffect, useState } from "react";

export default function SolicitudesRetiros() {

  const [retiros, setRetiros] = useState([]);

  const cargar = async () => {
    const res = await fetch("https://lavadero-backend-production.up.railway.app/retiros/pendientes");
    const data = await res.json();
    setRetiros(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const aceptar = async (id) => {
    if(!window.confirm("¿Aceptar solicitud?")) return;

    await fetch(`https://lavadero-backend-production.up.railway.app/retiros/${id}/aceptar`, {
      method:"PUT"
    });

    cargar();
  };

  const rechazar = async (id) => {
    if(!window.confirm("¿Rechazar solicitud?")) return;

    await fetch(`https://lavadero-backend-production.up.railway.app/retiros/${id}/rechazar`, {
      method:"PUT"
    });

    cargar();
  };

  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-4">
        Solicitudes de retiro / envío
      </h2>

      {retiros.length === 0 ? (
        <p>No hay solicitudes pendientes</p>
      ) : (

      <table className="w-full bg-white shadow rounded">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Tipo</th>
            <th className="p-2 text-left">Cliente</th>
            <th className="p-2 text-left">Orden</th>
            <th className="p-2 text-left">Zona</th>
            <th className="p-2 text-left">Dirección</th>
            <th className="p-2 text-left">Precio</th>
            <th className="p-2 text-left">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {retiros.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.id}</td>

              <td className="p-2 font-semibold">
                {r.tipo === "envio" ? "Envío" : "Retiro"}
              </td>

              <td className="p-2">{r.cliente}</td>
              <td className="p-2">#{r.orden_id}</td>
              <td className="p-2">Zona {r.zona}</td>
              <td className="p-2">{r.direccion}</td>
              <td className="p-2">${r.precio}</td>

              <td className="p-2 flex gap-2">
                <button
                  onClick={()=>aceptar(r.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Aceptar
                </button>

                <button
                  onClick={()=>rechazar(r.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Rechazar
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

      )}

    </div>
  );
}