import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Puntos() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    try {
      const res = await fetch(`${API}/puntos/todos`);
      const data = await res.json();
      setClientes(data);
    } catch {
      console.error("Error cargando puntos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const badge = (puntos) => {
    if (puntos >= 200) return { texto: "20% disponible", color: "bg-green-100 text-green-700" };
    if (puntos >= 150) return { texto: "15% disponible", color: "bg-green-100 text-green-700" };
    if (puntos >= 100) return { texto: "10% disponible", color: "bg-green-100 text-green-700" };
    return null;
  };

  const proximo = (puntos) => {
    if (puntos < 100) return { faltan: 100 - puntos, pct: 10 };
    if (puntos < 150) return { faltan: 150 - puntos, pct: 15 };
    if (puntos < 200) return { faltan: 200 - puntos, pct: 20 };
    return null;
  };

  if (loading) return <p className="p-6">Cargando puntos...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">🏆 Puntos de clientes</h2>
      <p className="text-gray-500 text-sm mb-6">1 punto cada $1.000 gastado</p>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="border rounded px-4 py-2 w-full max-w-sm mb-6"
      />

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">
            {clientes.filter(c => c.puntos_acumulados >= 100).length}
          </p>
          <p className="text-sm text-green-600">Con descuento disponible</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {clientes.filter(c => c.puntos_acumulados > 0 && c.puntos_acumulados < 100).length}
          </p>
          <p className="text-sm text-amber-600">Acumulando puntos</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{clientes.length}</p>
          <p className="text-sm text-slate-600">Total clientes</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-center">Puntos</th>
              <th className="px-4 py-3 text-right">Total gastado</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-gray-400">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c, i) => {
                const b = badge(c.puntos_acumulados);
                const p = proximo(c.puntos_acumulados);
                return (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-amber-600">
                        {c.puntos_acumulados}
                      </span>
                      {c.puntos_canjeados > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({c.puntos_canjeados} canjeados)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      ${Number(c.total_gastado).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.color}`}>
                          ✅ {b.texto}
                        </span>
                      ) : p ? (
                        <span className="text-xs text-gray-400">
                          Faltan {p.faltan} pts para {p.pct}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin puntos</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
