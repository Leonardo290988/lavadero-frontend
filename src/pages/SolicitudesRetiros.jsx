import { useEffect, useState } from "react";

export default function SolicitudesRetiros() {

  const [retiros, setRetiros] = useState([]);

  const API = "https://lavadero-backend-production-e1eb.up.railway.app";

  const cargar = async () => {
    const res = await fetch(`${API}/retiros/pendientes`);
    const data = await res.json();
    setRetiros(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const manejarEstado = async (retiro) => {

    let endpoint = "";

    if (retiro.estado === "pendiente") {
      endpoint = "aceptar";
    } 
    else if (retiro.estado === "aceptado") {
      endpoint = "en-camino";
    } 
    else if (retiro.estado === "en_camino") {
      endpoint = "retirado";
    }

    if (!endpoint) return;

    const res = await fetch(
      `${API}/retiros/${retiro.id}/${endpoint}`,
      { method: "PUT" }
    );

    const data = await res.json();

    // 👇 Abrir PDF si viene (solo cuando se acepta)
    if (data.pdf) {
      window.open(`${API}${data.pdf}`, "_blank");
    }

    cargar();
  };

  const rechazar = async (id) => {
    if(!window.confirm("¿Rechazar solicitud?")) return;

    await fetch(`${API}/retiros/${id}/rechazar`, {
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
            <th className="p-2 text-left">Zona</th>
            <th className="p-2 text-left">Dirección</th>
            <th className="p-2 text-left">Precio</th>
            <th className="p-2 text-left">Estado</th>
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
              <td className="p-2">Zona {r.zona}</td>
              <td className="p-2">{r.direccion}</td>
              <td className="p-2">${r.precio}</td>

              <td className="p-2">
                {r.estado}
              </td>

              <td className="p-2 flex gap-2">

                {/* BOTÓN DINÁMICO */}
                {r.estado !== "retirado" && (
                  <button
                    onClick={() => manejarEstado(r)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {r.estado === "pendiente" && "Aceptar"}
                    {r.estado === "aceptado" && "En camino"}
                    {r.estado === "en_camino" && "Retirado"}
                  </button>
                )}

                {/* RECHAZAR SOLO SI ESTÁ PENDIENTE */}
                {r.estado === "pendiente" && (
                  <button
                    onClick={() => rechazar(r.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Rechazar
                  </button>
                )}

              </td>

            </tr>
          ))}
        </tbody>

      </table>

      )}

    </div>
  );
}