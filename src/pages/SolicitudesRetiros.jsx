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

    if (!res.ok) {
      console.error("Error:", await res.text());
      return;
    }

    const data = await res.json();

    // 👇 Abrir PDF SOLO cuando se acepta
    if (endpoint === "aceptar" && data.pdf) {
      window.open(`${API}${data.pdf}`, "_blank");
    }

    cargar();
  };

  const rechazar = async (id) => {
    if (!window.confirm("¿Rechazar solicitud?")) return;

    await fetch(`${API}/retiros/${id}/rechazar`, {
      method: "PUT"
    });

    cargar();
  };

  // 🆕 Marcar como fallido (no había nadie en el domicilio)
  const marcarFallido = async (retiro) => {
    const intentosActuales = retiro.intentos || 0;
    const esSegundoIntento = intentosActuales >= 1;

    const mensaje = esSegundoIntento
      ? "⚠️ ATENCIÓN: este es el SEGUNDO intento fallido.\n\nEl retiro va a quedar CANCELADO definitivamente. El cliente recibirá un WhatsApp informando que debe abonar nuevamente para volver a solicitar el servicio.\n\n¿Confirmás?"
      : retiro.tiene_envio_asociado || retiro.tipo === "envio"
        ? "El retiro será REPROGRAMADO para mañana en el mismo horario.\n\n⚠️ El envío será anulado: si el cliente quiere envío, deberá abonarlo nuevamente.\n\nEl cliente recibirá un WhatsApp con esta info. ¿Confirmás?"
        : "Este retiro no tiene envío asociado.\n\nEl retiro quedará CANCELADO. El cliente recibirá un WhatsApp informando que debe abonar nuevamente para volver a solicitarlo.\n\n¿Confirmás?";

    if (!window.confirm(mensaje)) return;

    const res = await fetch(`${API}/retiros/${retiro.id}/fallido`, {
      method: "PUT"
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || "Error marcando retiro fallido");
      return;
    }

    const data = await res.json();

    if (data.accion === "reprogramado") {
      alert("✅ Retiro reprogramado.\nEl envío fue anulado.\nEl cliente fue notificado por push y WhatsApp.");
    } else {
      alert("✅ Retiro cancelado.\nEl cliente fue notificado por push y WhatsApp.");
    }

    cargar();
  };

  const renderEstado = (r) => {
    const intentos = r.intentos || 0;

    let badge;
    if (r.estado === "pendiente") {
      badge = <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">⏳ Pendiente</span>;
    } else if (r.estado === "aceptado") {
      badge = <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">✅ Aceptado</span>;
    } else if (r.estado === "en_camino") {
      badge = <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">🚚 En camino</span>;
    } else {
      badge = <span className="px-2 py-1 rounded-full text-xs font-bold">{r.estado}</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {badge}
        {intentos > 0 && (
          <span className="text-xs text-orange-600 font-semibold">
            ⚠️ Intento {intentos + 1}/2
          </span>
        )}
      </div>
    );
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
                {renderEstado(r)}
              </td>

              <td className="p-2">
                <div className="flex gap-2 flex-wrap">

                  {r.estado !== "retirado" && (
                    <button
                      onClick={() => manejarEstado(r)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      {r.estado === "pendiente" && "Aceptar"}
                      {r.estado === "aceptado" && "En camino"}
                      {r.estado === "en_camino" && "Retirado"}
                    </button>
                  )}

                  {r.estado === "pendiente" && (
                    <button
                      onClick={() => rechazar(r.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Rechazar
                    </button>
                  )}

                  {/* 🆕 Botón Fallido — solo cuando ya está en camino */}
                  {r.estado === "en_camino" && (
                    <button
                      onClick={() => marcarFallido(r)}
                      className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
                      title="No había nadie en el domicilio"
                    >
                      ❌ No encontrado
                    </button>
                  )}

                </div>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

      )}

    </div>
  );
}
