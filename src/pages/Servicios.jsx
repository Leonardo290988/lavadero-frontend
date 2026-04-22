import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

const fmtPesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fmtFecha = (f) => {
  if (!f) return "";
  const str = typeof f === "string" ? f.slice(0, 10) : new Date(f).toISOString().slice(0, 10);
  const [anio, mes, dia] = str.split("-");
  return `${dia}/${mes}/${anio}`;
};

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", precio: "" });
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState("servicios"); // servicios | historial | analisis
  const [historial, setHistorial] = useState([]);
  const [analisis, setAnalisis] = useState(null);

  const cargar = async () => {
    const [r, h, a] = await Promise.all([
      fetch(`${API}/servicios`).then(r => r.json()),
      fetch(`${API}/servicios/historial-precios`).then(r => r.json()),
      fetch(`${API}/servicios/analisis-precios`).then(r => r.json()),
    ]);
    setServicios(r);
    setHistorial(h);
    setAnalisis(a);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardarEdicion = async () => {
    if (!editando.nombre || editando.precio === "") return;
    setGuardando(true);
    try {
      await fetch(`${API}/servicios/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editando.nombre, precio: Number(editando.precio) })
      });
      setEditando(null);
      await cargar();
    } catch { alert("Error al guardar"); }
    finally { setGuardando(false); }
  };

  const toggleActivo = async (id) => {
    await fetch(`${API}/servicios/${id}/toggle`, { method: "PUT" });
    await cargar();
  };

  const crearServicio = async () => {
    if (!nuevo.nombre || nuevo.precio === "") return;
    setGuardando(true);
    try {
      await fetch(`${API}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevo.nombre, precio: Number(nuevo.precio) })
      });
      setNuevo({ nombre: "", precio: "" });
      setMostrarNuevo(false);
      await cargar();
    } catch { alert("Error al crear"); }
    finally { setGuardando(false); }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  const activos = servicios.filter(s => s.activo !== false);
  const inactivos = servicios.filter(s => s.activo === false);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">⚙️ Servicios y precios</h2>
          <p className="text-gray-500 text-sm">{activos.length} activos · {inactivos.length} inactivos</p>
        </div>
        {tab === "servicios" && (
          <button
            onClick={() => setMostrarNuevo(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nuevo servicio
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("servicios")}
          className={`px-4 py-2 rounded font-medium ${tab === "servicios" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
          Servicios
        </button>
        <button onClick={() => setTab("historial")}
          className={`px-4 py-2 rounded font-medium ${tab === "historial" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
          Historial de precios
        </button>
        <button onClick={() => setTab("analisis")}
          className={`px-4 py-2 rounded font-medium ${tab === "analisis" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
          Análisis
        </button>
      </div>

      {/* TAB HISTORIAL */}
      {tab === "historial" && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {historial.length === 0 ? (
            <p className="p-6 text-gray-500">No hay cambios de precio registrados aún. Los cambios se registran automáticamente cuando modificás un precio.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Servicio</th>
                  <th className="px-4 py-3 text-right">Precio anterior</th>
                  <th className="px-4 py-3 text-right">Precio nuevo</th>
                  <th className="px-4 py-3 text-center">Variación</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{h.nombre}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtPesos(h.precio_anterior)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtPesos(h.precio_nuevo)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${Number(h.porcentaje) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {Number(h.porcentaje) > 0 ? "+" : ""}{h.porcentaje}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtFecha(h.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB ANÁLISIS */}
      {tab === "analisis" && analisis && (
        <div className="space-y-4">
          {/* Sugerencia */}
          {analisis.sugerencia && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <p className="font-bold text-amber-800 mb-1">💡 Sugerencia de aumento</p>
              <p className="text-amber-700 text-sm mb-2">{analisis.sugerencia.motivo}</p>
              <p className="text-amber-800 font-semibold">Aumento sugerido: +{analisis.sugerencia.porcentaje}%</p>
            </div>
          )}
          {!analisis.sugerencia && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-bold text-green-700">✅ Los precios están en buen nivel</p>
              <p className="text-green-600 text-sm">El margen actual del mes es {analisis.margen}%, dentro del rango saludable.</p>
            </div>
          )}

          {/* Resumen del mes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{fmtPesos(analisis.total_ingresos)}</p>
              <p className="text-sm text-blue-600">Ingresos del mes</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{fmtPesos(analisis.total_gastos)}</p>
              <p className="text-sm text-red-600">Gastos del mes</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${analisis.margen >= 30 ? "bg-green-50 border-green-200" : analisis.margen >= 20 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <p className={`text-2xl font-bold ${analisis.margen >= 30 ? "text-green-700" : analisis.margen >= 20 ? "text-amber-700" : "text-red-700"}`}>{analisis.margen}%</p>
              <p className={`text-sm ${analisis.margen >= 30 ? "text-green-600" : analisis.margen >= 20 ? "text-amber-600" : "text-red-600"}`}>Margen</p>
            </div>
          </div>

          {/* Detalle gastos */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-bold mb-3">Detalle de gastos del mes</h3>
            <div className="space-y-2">
              {analisis.gastos_detalle.map((g, i) => (
                <div key={i} className="flex justify-between py-2 border-b">
                  <span className="text-gray-600 capitalize">{g.categoria.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-red-700">{fmtPesos(g.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {analisis.dias_desde_aumento < 999 && (
            <p className="text-gray-500 text-sm text-center">
              Último aumento de precios: hace {analisis.dias_desde_aumento} días
            </p>
          )}
        </div>
      )}

      {tab === "servicios" && (
        <>
      {mostrarNuevo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Nuevo servicio</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600">Nombre</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full mt-1"
                placeholder="Ej: Acolchado doble"
                value={nuevo.nombre}
                onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
              />
            </div>
            <div className="w-36">
              <label className="text-sm text-gray-600">Precio $</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full mt-1"
                placeholder="0"
                value={nuevo.precio}
                onChange={e => setNuevo({ ...nuevo, precio: e.target.value })}
              />
            </div>
            <button
              onClick={crearServicio}
              disabled={guardando}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => { setMostrarNuevo(false); setNuevo({ nombre: "", precio: "" }); }}
              className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Servicios activos */}
      <div className="bg-white rounded-xl shadow mb-6">
        <div className="px-4 py-3 bg-slate-800 text-white rounded-t-xl font-semibold text-sm">
          Servicios activos
        </div>
        {activos.map(s => (
          <div key={s.id} className="border-t px-4 py-3">
            {editando?.id === s.id ? (
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  className="border rounded px-3 py-1 flex-1"
                  value={editando.nombre}
                  onChange={e => setEditando({ ...editando, nombre: e.target.value })}
                />
                <input
                  type="number"
                  className="border rounded px-3 py-1 w-32"
                  value={editando.precio}
                  onChange={e => setEditando({ ...editando, precio: e.target.value })}
                />
                <button
                  onClick={guardarEdicion}
                  disabled={guardando}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  ✅ Guardar
                </button>
                <button
                  onClick={() => setEditando(null)}
                  className="bg-slate-200 px-3 py-1 rounded text-sm hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{s.nombre}</span>
                  <span className="text-gray-500 text-sm ml-3">${Number(s.precio).toLocaleString("es-AR")}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditando({ id: s.id, nombre: s.nombre, precio: s.precio })}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => toggleActivo(s.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Servicios inactivos */}
      {inactivos.length > 0 && (
        <div className="bg-white rounded-xl shadow opacity-60">
          <div className="px-4 py-3 bg-slate-400 text-white rounded-t-xl font-semibold text-sm">
            Servicios inactivos
          </div>
          {inactivos.map(s => (
            <div key={s.id} className="border-t px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium line-through text-gray-400">{s.nombre}</span>
                <span className="text-gray-400 text-sm ml-3">${Number(s.precio).toLocaleString("es-AR")}</span>
              </div>
              <button
                onClick={() => toggleActivo(s.id)}
                className="text-green-600 hover:underline text-sm"
              >
                Reactivar
              </button>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
