import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Resumenes() {

  const [tipo, setTipo] = useState("diario");
  const [datos, setDatos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [turnoId, setTurnoId] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [imprimiendo, setImprimiendo] = useState(null); // id del resumen que se está imprimiendo

  // =========================
  // CARGAR TURNOS
  // =========================
  const cargarTurnos = async () => {
    const res = await fetch(`${API}/caja/turnos`);
    const data = await res.json();
    setTurnos(data);
  };

  // =========================
  // CARGAR RESÚMENES
  // =========================
  const cargarResumen = async () => {
    setDatos([]);
    setMovimientos([]);

    if (tipo === "turno") {
      // Cargar todos los turnos como lista
      const res = await fetch(`${API}/caja/turnos`);
      const data = await res.json();
      setTurnos(data);
      // Si hay turno seleccionado, traer su detalle
      if (turnoId) {
        const res2 = await fetch(`${API}/caja/resumen/turno/${turnoId}`);
        const d = await res2.json();
        setDatos([{ ...d, id: turnoId, _caja_id: turnoId }]);
        cargarMovimientos(turnoId);
      }
      return;
    }

    const endpoints = {
      diario: "diarios",
      semanal: "semanales",
      mensual: "mensuales"
    };

    const res = await fetch(`${API}/caja/resumenes/${endpoints[tipo]}`);
    const data = await res.json();
    setDatos(data);
  };

  // =========================
  // CARGAR MOVIMIENTOS
  // =========================
  const cargarMovimientos = async (id) => {
    const res = await fetch(`${API}/caja/movimientos/${id}`);
    const data = await res.json();
    setMovimientos(data);
  };

  useEffect(() => { cargarTurnos(); }, []);
  useEffect(() => { cargarResumen(); }, [tipo, turnoId]);

  // =========================
  // IMPRIMIR UN RESUMEN
  // =========================
  const imprimir = async (resumen) => {
    setImprimiendo(resumen.id || resumen._caja_id);

    try {
      let url;

      if (tipo === "turno") {
        // Usar el caja_id para imprimir turno
        const cajaId = resumen._caja_id || resumen.id;
        const res = await fetch(`${API}/caja/resumenes/imprimir-turno/${cajaId}`);
        const data = await res.json();
        if (!data.pdf) { alert("Error al generar el PDF"); return; }
        url = `${API}${data.pdf}?t=${Date.now()}`;
      } else {
        // Para diario/semanal/mensual usar el id del resumen guardado
        const res = await fetch(`${API}/caja/resumenes/imprimir/${resumen.id}`);
        const data = await res.json();
        if (!data.pdf) { alert("Error al generar el PDF"); return; }
        url = `${API}${data.pdf}?t=${Date.now()}`;
      }

      window.open(url, "_blank");

    } catch (err) {
      console.error(err);
      alert("Error al imprimir");
    } finally {
      setImprimiendo(null);
    }
  };

  // =========================
  // FORMATO
  // =========================
  const fmt = (n) =>
    Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  // Convierte cualquier fecha a "DD/MM/YY" sin bugs de timezone
  const fmtFecha = (f) => {
    if (!f) return "";
    // Si ya viene formateada con to_char (ej: "08/04/26" o "08/04/26 20:57"), tomar solo la parte de fecha
    if (f.includes("/")) return f.slice(0, 8);
    // Si viene como ISO o YYYY-MM-DD, tomar solo los primeros 10 chars y parsear sin Date()
    const solo = f.slice(0, 10); // "2026-04-08"
    const [y, m, d] = solo.split("-");
    if (!y || !m || !d) return f;
    return `${d}/${m}/${y.slice(2)}`;
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">📊 Resúmenes</h2>

      {/* Selector de tipo */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {["diario", "semanal", "mensual", "turno"].map((t) => (
          <button
            key={t}
            onClick={() => { setTipo(t); setTurnoId(""); }}
            className={`px-4 py-2 rounded font-semibold capitalize ${
              tipo === t
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t === "turno" ? "Por turno" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}

        {tipo === "turno" && (
          <select
            value={turnoId}
            onChange={(e) => setTurnoId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Seleccione turno</option>
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {fmtFecha(t.fecha)} — Turno {t.turno}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla */}
      {datos.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-gray-500">
          {tipo === "turno" && !turnoId
            ? "Seleccioná un turno para ver el resumen"
            : "No hay resúmenes para mostrar"}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                {tipo !== "turno" && (
                  <>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Generado</th>
                  </>
                )}
                {tipo === "turno" && (
                  <>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Turno</th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Efectivo</th>
                <th className="px-4 py-3 text-right">Digital</th>
                <th className="px-4 py-3 text-right">Gastos</th>
                <th className="px-4 py-3 text-right">Guardado</th>
                <th className="px-4 py-3 text-right font-bold">Ventas</th>
                <th className="px-4 py-3 text-right font-bold">Caja Final</th>
                <th className="px-4 py-3 text-center">Imprimir</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((r, i) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  {tipo !== "turno" && (
                    <>
                      <td className="px-4 py-3">{fmtFecha(r.fecha_desde)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.creado_en || ""}</td>
                    </>
                  )}
                  {tipo === "turno" && (
                    <>
                      <td className="px-4 py-3">{fmtFecha(r.fecha) || fmtFecha(r.fecha_desde)}</td>
                      <td className="px-4 py-3 capitalize">{r.turno || ""}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">{fmt(r.ingresos_efectivo)}</td>
                  <td className="px-4 py-3 text-right">{fmt(r.ingresos_digital || r.transferencias)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{fmt(r.gastos)}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{fmt(r.guardado)}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(r.total_ventas)}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(r.caja_final || r.efectivo_final)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => imprimir(r)}
                      disabled={imprimiendo === (r.id || r._caja_id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                    >
                      {imprimiendo === (r.id || r._caja_id) ? "⏳" : "🖨️ PDF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle de movimientos del turno */}
      {tipo === "turno" && movimientos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Detalle de movimientos</h3>
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Forma pago</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 text-xs text-gray-500">{m.fecha}</td>
                    <td className="px-4 py-2 capitalize">{m.tipo}</td>
                    <td className="px-4 py-2">{m.descripcion}</td>
                    <td className="px-4 py-2">{m.forma_pago}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${m.tipo === "gasto" ? "text-red-600" : "text-green-700"}`}>
                      {fmt(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
