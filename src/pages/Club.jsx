import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";
const PRECIO_DEFAULT = 8000;

const fmtPesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fmtFecha = (f) => {
  if (!f) return "";
  const str = typeof f === "string" ? f.slice(0, 10) : new Date(f).toISOString().slice(0, 10);
  const [anio, mes, dia] = str.split("-");
  const diasSemana = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const d = new Date(str + "T12:00:00");
  return `${diasSemana[d.getDay()]} ${dia}/${mes}/${anio}`;
};

export default function Club() {
  const hoy = new Date().toISOString().slice(0, 10);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";
  const [valets, setValets] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [tab, setTab] = useState("pendientes"); // pendientes | historial
  const [loading, setLoading] = useState(true);

  // Form nuevo
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ fecha: hoy, cantidad: "", precio_unitario: PRECIO_DEFAULT, observacion: "" });
  const [guardando, setGuardando] = useState(false);

  // Edición
  const [editando, setEditando] = useState(null);

  // Facturación
  const [seleccionados, setSeleccionados] = useState([]);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [nroFactura, setNroFactura] = useState("");
  const [fechaFactura, setFechaFactura] = useState(hoy);

  const cargar = async () => {
    setLoading(true);
    try {
      const [todos, res] = await Promise.all([
        fetch(`${API}/club`).then(r => r.json()),
        fetch(`${API}/club/resumen-factura`).then(r => r.json()),
      ]);
      setValets(todos);
      setResumen(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const pendientes = valets.filter(v => !v.facturado);
  const facturados = valets.filter(v => v.facturado);
  const lista = tab === "pendientes" ? pendientes : facturados;

  const totalPendiente = pendientes.reduce((acc, v) => acc + Number(v.cantidad) * Number(v.precio_unitario), 0);

  const guardar = async () => {
    if (!form.cantidad || !form.fecha) return;
    setGuardando(true);
    try {
      await fetch(`${API}/club`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cantidad: Number(form.cantidad), precio_unitario: Number(form.precio_unitario) })
      });
      setMostrarForm(false);
      setForm({ fecha: hoy, cantidad: "", precio_unitario: PRECIO_DEFAULT, observacion: "" });
      await cargar();
    } catch { alert("Error al guardar"); }
    finally { setGuardando(false); }
  };

  const guardarEdicion = async () => {
    try {
      await fetch(`${API}/club/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: Number(editando.cantidad), precio_unitario: Number(editando.precio_unitario), observacion: editando.observacion })
      });
      setEditando(null);
      await cargar();
    } catch { alert("Error al guardar"); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`${API}/club/${id}`, { method: "DELETE" });
    await cargar();
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === pendientes.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(pendientes.map(v => v.id));
    }
  };

  const totalSeleccionado = pendientes
    .filter(v => seleccionados.includes(v.id))
    .reduce((acc, v) => acc + Number(v.cantidad) * Number(v.precio_unitario), 0);

  const facturar = async () => {
    if (seleccionados.length === 0) return;
    try {
      await fetch(`${API}/club/facturar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: seleccionados, numero_factura: nroFactura, fecha_factura: fechaFactura })
      });
      setSeleccionados([]);
      setMostrarFactura(false);
      setNroFactura("");
      await cargar();
    } catch { alert("Error al facturar"); }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold">🏀 Club Los Indios</h2>
          <p className="text-gray-500 text-sm">Registro de valets — {fmtPesos(PRECIO_DEFAULT)} por valet</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar día
        </button>
      </div>

      {/* Resumen pendiente */}
      {resumen && (
        <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{resumen.dias || 0}</p>
            <p className="text-sm text-amber-600">Días sin facturar</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{resumen.total_valets || 0}</p>
            <p className="text-sm text-blue-600">Valets sin facturar</p>
          </div>
          {esAdmin && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{fmtPesos(resumen.total_pesos || 0)}</p>
              <p className="text-sm text-green-600">Total a facturar</p>
            </div>
          )}
        </div>
      )}

      {/* Form nuevo */}
      {mostrarForm && (
        <div className="bg-slate-50 border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-4">Registrar día</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Fecha</label>
              <input type="date" className="border rounded px-3 py-2 w-full mt-1"
                value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Cantidad de valets</label>
              <input type="number" className="border rounded px-3 py-2 w-full mt-1"
                value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })}
                placeholder="0" min="1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Precio por valet $</label>
              <input type="number" className="border rounded px-3 py-2 w-full mt-1"
                value={form.precio_unitario} onChange={e => setForm({ ...form, precio_unitario: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Observación (opcional)</label>
              <input type="text" className="border rounded px-3 py-2 w-full mt-1"
                value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })}
                placeholder="Ej: ropa de fútbol" />
            </div>
          </div>
          {form.cantidad && esAdmin && (
            <p className="mt-3 text-sm text-green-700 font-semibold">
              Subtotal: {fmtPesos(Number(form.cantidad) * Number(form.precio_unitario))}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={guardar} disabled={guardando}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal facturar */}
      {mostrarFactura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-bold text-lg mb-4">Marcar como facturado</h3>
            <p className="text-sm text-gray-600 mb-4">
              {seleccionados.length} días seleccionados — Total: <strong>{fmtPesos(totalSeleccionado)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Número de factura</label>
                <input type="text" className="border rounded px-3 py-2 w-full mt-1"
                  value={nroFactura} onChange={e => setNroFactura(e.target.value)}
                  placeholder="Ej: 0001-00000123" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Fecha de factura</label>
                <input type="date" className="border rounded px-3 py-2 w-full mt-1"
                  value={fechaFactura} onChange={e => setFechaFactura(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={facturar}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1">
                Confirmar
              </button>
              <button onClick={() => setMostrarFactura(false)}
                className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("pendientes")}
          className={`px-4 py-2 rounded font-medium ${tab === "pendientes" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
          Pendientes ({pendientes.length})
        </button>
        <button onClick={() => setTab("historial")}
          className={`px-4 py-2 rounded font-medium ${tab === "historial" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
          Facturados ({facturados.length})
        </button>

        {tab === "pendientes" && pendientes.length > 0 && (
          <div className="ml-auto flex gap-2 items-center">
            {seleccionados.length > 0 && (
              <button onClick={() => setMostrarFactura(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                ✅ Facturar seleccionados ({seleccionados.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {lista.length === 0 ? (
          <p className="p-6 text-gray-500">
            {tab === "pendientes" ? "No hay valets pendientes de facturar" : "No hay valets facturados"}
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                {tab === "pendientes" && (
                  <th className="px-4 py-3 text-center">
                    <input type="checkbox"
                      checked={seleccionados.length === pendientes.length && pendientes.length > 0}
                      onChange={seleccionarTodos} />
                  </th>
                )}
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Valets</th>
                {esAdmin && <th className="px-4 py-3 text-center">Precio unit.</th>}
                {esAdmin && <th className="px-4 py-3 text-right">Subtotal</th>}
                <th className="px-4 py-3 text-left">Observación</th>
                {tab === "historial" && <th className="px-4 py-3 text-left">Factura</th>}
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v, i) => (
                <tr key={i} className={`border-t ${seleccionados.includes(v.id) ? "bg-green-50" : ""}`}>
                  {tab === "pendientes" && (
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox"
                        checked={seleccionados.includes(v.id)}
                        onChange={() => toggleSeleccion(v.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{fmtFecha(v.fecha)}</td>
                  <td className="px-4 py-3 text-center">
                    {editando?.id === v.id ? (
                      <input type="number" className="border rounded px-2 py-1 w-16 text-center"
                        value={editando.cantidad} onChange={e => setEditando({ ...editando, cantidad: e.target.value })} />
                    ) : (
                      <span className="font-bold text-blue-700">{v.cantidad}</span>
                    )}
                  </td>
                  {esAdmin && <td className="px-4 py-3 text-center">{fmtPesos(v.precio_unitario)}</td>}
                  {esAdmin && (
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmtPesos(Number(v.cantidad) * Number(v.precio_unitario))}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {editando?.id === v.id ? (
                      <input type="text" className="border rounded px-2 py-1 w-full"
                        value={editando.observacion} onChange={e => setEditando({ ...editando, observacion: e.target.value })} />
                    ) : v.observacion}
                  </td>
                  {tab === "historial" && (
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {v.numero_factura && <span className="font-medium">{v.numero_factura}</span>}
                      {v.fecha_factura && <span className="block">{fmtFecha(v.fecha_factura)}</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    {!v.facturado && (
                      editando?.id === v.id ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={guardarEdicion} className="text-green-600 hover:underline text-xs">✅</button>
                          <button onClick={() => setEditando(null)} className="text-gray-400 hover:underline text-xs">✗</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setEditando({ ...v })} className="text-blue-600 hover:underline text-xs">✏️</button>
                          <button onClick={() => eliminar(v.id)} className="text-red-500 hover:underline text-xs">🗑️</button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {tab === "pendientes" && pendientes.length > 0 && (
              <tfoot className="bg-slate-100">
                <tr>
                  <td colSpan={esAdmin ? 3 : 2} className="px-4 py-3 font-bold text-right">TOTAL</td>
                  <td className="px-4 py-3 text-center font-bold">
                    {pendientes.reduce((acc, v) => acc + Number(v.cantidad), 0)} valets
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {fmtPesos(totalPendiente)}
                    </td>
                  )}
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
