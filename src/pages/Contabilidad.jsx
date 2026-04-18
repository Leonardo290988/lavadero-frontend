import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

const CATEGORIAS_EGRESO = [
  { value: "sueldo_lautaro", label: "Sueldo Lautaro" },
  { value: "sueldo_julieta", label: "Sueldo Julieta" },
  { value: "insumos", label: "Insumos" },
  { value: "luz", label: "Luz" },
  { value: "gas", label: "Gas" },
  { value: "agua", label: "Agua" },
  { value: "municipal", label: "Municipal" },
  { value: "otro_egreso", label: "Otro egreso" },
];

const CATEGORIAS_INGRESO = [
  { value: "club", label: "Club" },
  { value: "otro_ingreso", label: "Otro ingreso" },
];

const fmtPesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fmtFecha = (f) => {
  if (!f) return "";
  const str = typeof f === "string" ? f.slice(0, 10) : new Date(f).toISOString().slice(0, 10);
  const [anio, mes, dia] = str.split("-");
  return `${dia}/${mes}/${anio}`;
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function Contabilidad() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [tab, setTab] = useState("movimientos"); // movimientos | balance
  const [movimientos, setMovimientos] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo movimiento
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    tipo: "egreso",
    categoria: "sueldo_lautaro",
    descripcion: "",
    monto: "",
    fecha: hoy.toISOString().slice(0, 10)
  });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [mov, bal] = await Promise.all([
        fetch(`${API}/contabilidad?mes=${mes}&anio=${anio}`).then(r => r.json()),
        fetch(`${API}/contabilidad/balance?mes=${mes}&anio=${anio}`).then(r => r.json()),
      ]);
      setMovimientos(mov);
      setBalance(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [mes, anio]);

  const guardar = async () => {
    if (!form.monto || !form.fecha) return;
    setGuardando(true);
    try {
      await fetch(`${API}/contabilidad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, monto: Number(form.monto) })
      });
      setMostrarForm(false);
      setForm({ tipo: "egreso", categoria: "sueldo_lautaro", descripcion: "", monto: "", fecha: hoy.toISOString().slice(0, 10) });
      await cargar();
    } catch { alert("Error al guardar"); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`${API}/contabilidad/${id}`, { method: "DELETE" });
    await cargar();
  };

  const labelCategoria = (cat) => {
    return [...CATEGORIAS_EGRESO, ...CATEGORIAS_INGRESO].find(c => c.value === cat)?.label || cat;
  };

  const anios = [hoy.getFullYear(), hoy.getFullYear() - 1];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">💼 Contabilidad</h2>

      {/* Selector mes/año */}
      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {MESES.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Tabs */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setTab("movimientos")}
            className={`px-4 py-2 rounded font-medium ${tab === "movimientos" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
          >
            Movimientos
          </button>
          <button
            onClick={() => setTab("balance")}
            className={`px-4 py-2 rounded font-medium ${tab === "balance" ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
          >
            Balance mensual
          </button>
        </div>

        <button
          onClick={() => setMostrarForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo movimiento
        </button>
      </div>

      {/* Formulario nuevo movimiento */}
      {mostrarForm && (
        <div className="bg-slate-50 border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-4">Nuevo movimiento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Tipo</label>
              <select
                className="border rounded px-3 py-2 w-full mt-1"
                value={form.tipo}
                onChange={e => {
                  const tipo = e.target.value;
                  setForm({ ...form, tipo, categoria: tipo === "egreso" ? "sueldo_lautaro" : "club" });
                }}
              >
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Categoría</label>
              <select
                className="border rounded px-3 py-2 w-full mt-1"
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
              >
                {(form.tipo === "egreso" ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Monto $</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full mt-1"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Fecha</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full mt-1"
                value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Descripción (opcional)</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full mt-1"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Sueldo semana del 7 al 13 de abril"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={guardar}
              disabled={guardando}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? <p>Cargando...</p> : (
        <>
          {/* TAB MOVIMIENTOS */}
          {tab === "movimientos" && (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              {movimientos.length === 0 ? (
                <p className="p-6 text-gray-500">No hay movimientos para {MESES[mes-1]} {anio}</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Categoría</th>
                      <th className="px-4 py-3 text-left">Descripción</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m, i) => (
                      <tr key={i} className={`border-t ${m.tipo === "ingreso" ? "bg-green-50" : ""}`}>
                        <td className="px-4 py-3">{fmtFecha(m.fecha)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.tipo === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{labelCategoria(m.categoria)}</td>
                        <td className="px-4 py-3 text-gray-500">{m.descripcion}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${m.tipo === "ingreso" ? "text-green-700" : "text-red-700"}`}>
                          {m.tipo === "egreso" ? "-" : "+"}{fmtPesos(m.monto)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminar(m.id)}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB BALANCE */}
          {tab === "balance" && balance && (
            <div className="space-y-4">

              {/* Tarjetas resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600">Ingresos caja (neto)</p>
                  <p className="text-xl font-bold text-blue-700">{fmtPesos(balance.resumen.total_caja)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-600">Ingresos externos</p>
                  <p className="text-xl font-bold text-green-700">{fmtPesos(balance.resumen.total_ingresos_externos)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-600">Total egresos</p>
                  <p className="text-xl font-bold text-red-700">{fmtPesos(balance.resumen.total_egresos)}</p>
                </div>
                <div className={`border rounded-xl p-4 text-center ${balance.resumen.balance >= 0 ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"}`}>
                  <p className={`text-sm ${balance.resumen.balance >= 0 ? "text-green-600" : "text-red-600"}`}>Balance</p>
                  <p className={`text-xl font-bold ${balance.resumen.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {fmtPesos(balance.resumen.balance)}
                  </p>
                </div>
              </div>

              {/* Detalle ingresos */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold mb-3 text-green-700">📈 Ingresos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Caja (efectivo)</span>
                    <span className="font-semibold">{fmtPesos(balance.caja?.efectivo || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Caja (digital)</span>
                    <span className="font-semibold">{fmtPesos(balance.caja?.digital || 0)}</span>
                  </div>
                  {Number(balance.caja?.gastos || 0) > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-400 text-sm">Gastos de caja (descuentos)</span>
                      <span className="font-semibold text-red-500">-{fmtPesos(balance.caja?.gastos || 0)}</span>
                    </div>
                  )}
                  {balance.ingresos_externos.map((ing, i) => (
                    <div key={i} className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">{labelCategoria(ing.categoria)}</span>
                      <span className="font-semibold text-green-700">{fmtPesos(ing.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold text-green-700">
                    <span>TOTAL INGRESOS</span>
                    <span>{fmtPesos(balance.resumen.total_ingresos)}</span>
                  </div>
                </div>
              </div>

              {/* Detalle egresos */}
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold mb-3 text-red-700">📉 Egresos</h3>
                <div className="space-y-2">
                  {balance.egresos.length === 0 ? (
                    <p className="text-gray-400 text-sm">Sin egresos registrados</p>
                  ) : (
                    <>
                      {balance.egresos.map((eg, i) => (
                        <div key={i} className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">
                            {labelCategoria(eg.categoria)}
                            {eg.descripcion && <span className="text-xs text-gray-400 ml-2">({eg.descripcion})</span>}
                          </span>
                          <span className="font-semibold text-red-700">{fmtPesos(eg.total)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold text-red-700">
                        <span>TOTAL EGRESOS</span>
                        <span>{fmtPesos(balance.resumen.total_egresos)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Balance final */}
              <div className={`rounded-xl p-5 text-center ${balance.resumen.balance >= 0 ? "bg-green-600" : "bg-red-600"} text-white`}>
                <p className="text-lg">Balance {MESES[mes-1]} {anio}</p>
                <p className="text-4xl font-bold mt-1">{fmtPesos(balance.resumen.balance)}</p>
                <p className="text-sm opacity-80 mt-1">
                  {balance.resumen.balance >= 0 ? "✅ Resultado positivo" : "⚠️ Resultado negativo"}
                </p>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
