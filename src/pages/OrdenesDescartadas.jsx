import { useEffect, useState } from "react";
import { formatearFechaHoraISO } from "../utils/fechas";

const API_URL = "https://lavadero-backend-production-e1eb.up.railway.app";

// Parsea servicios_json venga como texto (JSON string) o ya como array (jsonb)
function parsearServicios(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  try {
    const parsed = typeof valor === "string" ? JSON.parse(valor) : valor;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function OrdenesDescartadas() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      const res = await fetch(`${API_URL}/ordenes/descartadas`);
      const data = await res.json();
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando órdenes descartadas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading) {
    return <p className="p-6">Cargando órdenes descartadas...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Órdenes descartadas</h2>
      <p className="text-sm text-gray-500 mb-6">
        {ordenes.length} {ordenes.length === 1 ? "orden descartada" : "órdenes descartadas"}
      </p>

      {ordenes.length === 0 ? (
        <p>No hay órdenes descartadas</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Ingreso</th>
                <th className="px-4 py-3 text-left">Lista</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Seña</th>
                <th className="px-4 py-3 text-left">Servicios</th>
                <th className="px-4 py-3 text-left">Motivo</th>
              </tr>
            </thead>

            <tbody>
              {ordenes.map((o) => {
                const servicios = parsearServicios(o.servicios_json);
                return (
                  <tr key={o.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">#{o.orden_id_original}</td>
                    <td className="px-4 py-3">{o.cliente_nombre}</td>
                    <td className="px-4 py-3">{o.cliente_telefono || "-"}</td>
                    <td className="px-4 py-3">
                      {o.fecha_ingreso ? formatearFechaHoraISO(o.fecha_ingreso) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {o.fecha_lista ? formatearFechaHoraISO(o.fecha_lista) : "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      ${Number(o.total || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      ${Number(o.senia || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      {servicios.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <ul className="list-disc list-inside text-xs text-gray-600">
                          {servicios.map((s, i) => (
                            <li key={i}>
                              {Number(s.cantidad) || 1}x {s.nombre}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{o.motivo || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
