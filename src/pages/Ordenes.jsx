import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatearFechaHoraISO } from "../utils/fechas";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [todasOrdenes, setTodasOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [verTodas, setVerTodas] = useState(false);
  const navigate = useNavigate();

  const cargarOrdenes = async () => {
    try {
      const [abiertas, todas] = await Promise.all([
        fetch(`${API}/ordenes/abiertas`).then(r => r.json()),
        fetch(`${API}/ordenes`).then(r => r.json()),
      ]);
      setOrdenes(abiertas);
      setTodasOrdenes(todas);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarOrden = async (id) => {
    if (!confirm(`¿Cerrar la orden #${id}?`)) return;

    try {
      const res = await fetch(`${API}/ordenes/${id}/cerrar`, { method: "PUT" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al cerrar orden");
        return;
      }

      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, "_blank");
      }

      cargarOrdenes();
    } catch (error) {
      console.error("Error cerrando orden:", error);
      alert("Error de conexión con el servidor");
    }
  };

  useEffect(() => { cargarOrdenes(); }, []);

  if (loading) return <p className="p-6">Cargando órdenes...</p>;

  // Filtrar según la búsqueda
  const listaBase = verTodas ? todasOrdenes : ordenes;
  const ordenesFiltradas = busqueda.trim()
    ? listaBase.filter(o =>
        o.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(o.id).includes(busqueda)
      )
    : listaBase;

  const estadoColor = (estado) => {
    switch (estado) {
      case "ingresado": return "bg-blue-100 text-blue-700";
      case "confirmada": return "bg-yellow-100 text-yellow-700";
      case "lista": return "bg-green-100 text-green-700";
      case "retirada": return "bg-slate-100 text-slate-600";
      case "entregada": return "bg-slate-100 text-slate-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Órdenes</h2>

      {/* Controles */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Buscar por cliente o número de orden..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border rounded px-4 py-2 w-72"
        />

        <div className="flex gap-2">
          <button
            onClick={() => { setVerTodas(false); setBusqueda(""); }}
            className={`px-4 py-2 rounded font-medium ${!verTodas ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Abiertas ({ordenes.length})
          </button>
          <button
            onClick={() => { setVerTodas(true); setBusqueda(""); }}
            className={`px-4 py-2 rounded font-medium ${verTodas ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Historial completo
          </button>
        </div>
      </div>

      {ordenesFiltradas.length === 0 ? (
        <p className="text-gray-500">
          {busqueda ? `No se encontraron órdenes para "${busqueda}"` : "No hay órdenes"}
        </p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Fecha ingreso</th>
                <th className="px-4 py-3 text-left">Total</th>
                {verTodas && <th className="px-4 py-3 text-center">Estado</th>}
                {!verTodas && <th className="px-4 py-3 text-center">Envío</th>}
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o) => (
                <tr key={o.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">#{o.id}</td>
                  <td className="px-4 py-3 font-medium">{o.cliente}</td>
                  <td className="px-4 py-3">
                    {formatearFechaHoraISO(o.fecha_ingreso)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${Math.max(Number(o.total || 0) - Number(o.senia || 0), 0)}
                  </td>
                  {verTodas && (
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoColor(o.estado)}`}>
                        {o.estado}
                      </span>
                    </td>
                  )}
                  {!verTodas && (
                    <td className="px-4 py-3 text-center font-semibold"
                      style={{ color: o.tiene_envio ? "green" : "gray" }}>
                      {o.tiene_envio ? "SI" : "NO"}
                    </td>
                  )}
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/ordenes/${o.id}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Ver detalle
                    </button>
                    {(o.estado === "ingresado" || o.estado === "confirmada") && (
                      <button
                        onClick={() => cerrarOrden(o.id)}
                        className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                      >
                        Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 p-3">{ordenesFiltradas.length} órdenes</p>
        </div>
      )}
    </div>
  );
}
