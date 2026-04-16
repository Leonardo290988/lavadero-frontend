import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // { id, nombre, precio }
  const [nuevo, setNuevo] = useState({ nombre: "", precio: "" });
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const r = await fetch(`${API}/servicios`);
    const data = await r.json();
    setServicios(data);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">⚙️ Servicios y precios</h2>
          <p className="text-gray-500 text-sm">{activos.length} activos · {inactivos.length} inactivos</p>
        </div>
        <button
          onClick={() => setMostrarNuevo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* Formulario nuevo servicio */}
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
    </div>
  );
}
