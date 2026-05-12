import { useEffect, useMemo, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Resumenes() {

  const [tipo, setTipo] = useState("diario");
  const [datos, setDatos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [turnoId, setTurnoId] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [imprimiendo, setImprimiendo] = useState(null);

  // 🆕 Mes seleccionado para vistas Diario/Semanal (null = mostrando selector de meses)
  const [mesSeleccionado, setMesSeleccionado] = useState(null); // "2026-10" formato YYYY-MM
  const [verAntiguos, setVerAntiguos] = useState(false);

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
      const res = await fetch(`${API}/caja/turnos`);
      const data = await res.json();
      setTurnos(data);
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

  const cargarMovimientos = async (id) => {
    const res = await fetch(`${API}/caja/movimientos/${id}`);
    const data = await res.json();
    setMovimientos(data);
  };

  useEffect(() => { cargarTurnos(); }, []);
  useEffect(() => {
    cargarResumen();
    // Al cambiar de tipo, resetear mes y "ver antiguos"
    setMesSeleccionado(null);
    setVerAntiguos(false);
  }, [tipo, turnoId]);

  // =========================
  // IMPRIMIR
  // =========================
  const imprimir = async (resumen) => {
    setImprimiendo(resumen.id || resumen._caja_id);

    try {
      let url;

      if (tipo === "turno") {
        const cajaId = resumen._caja_id || resumen.id;
        const res = await fetch(`${API}/caja/resumenes/imprimir-turno/${cajaId}`);
        const data = await res.json();
        if (!data.pdf) { alert("Error al generar el PDF"); return; }
        url = `${API}${data.pdf}?t=${Date.now()}`;
      } else {
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

  const fmtFecha = (f) => {
    if (!f) return "";
    if (f.includes("/")) return f.slice(0, 8);
    const solo = f.slice(0, 10);
    const [y, m, d] = solo.split("-");
    if (!y || !m || !d) return f;
    return `${d}/${m}/${y.slice(2)}`;
  };

  // =========================
  // 🆕 EXTRAER YYYY-MM de un resumen
  // =========================
  const obtenerClaveMes = (r) => {
    const f = r.fecha_desde || r.fecha || "";
    if (!f) return null;
    // Si viene como "DD/MM/YY" o "DD/MM/YY HH:MM"
    if (f.includes("/")) {
      const partes = f.slice(0, 8).split("/");
      if (partes.length !== 3) return null;
      const [dd, mm, yy] = partes;
      const yyyy = yy.length === 2 ? `20${yy}` : yy;
      return `${yyyy}-${mm}`;
    }
    // Si viene como ISO "YYYY-MM-DD..."
    const solo = f.slice(0, 10);
    const [y, m] = solo.split("-");
    if (!y || !m) return null;
    return `${y}-${m}`;
  };

  const NOMBRES_MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const formatearNombreMes = (clave) => {
    if (!clave) return "";
    const [y, m] = clave.split("-");
    const nombreMes = NOMBRES_MESES[parseInt(m, 10) - 1] || m;
    return `${nombreMes} ${y}`;
  };

  // =========================
  // 🆕 AGRUPAR RESÚMENES POR MES
  // =========================
  const mesesAgrupados = useMemo(() => {
    if (tipo !== "diario" && tipo !== "semanal") return [];

    const grupos = new Map();

    for (const r of datos) {
      const clave = obtenerClaveMes(r);
      if (!clave) continue;

      if (!grupos.has(clave)) {
        grupos.set(clave, {
          clave,
          cantidad: 0,
          totalVentas: 0,
          totalEfectivo: 0,
          totalDigital: 0,
          resumenes: []
        });
      }
      const g = grupos.get(clave);
      g.cantidad++;
      g.totalVentas += Number(r.total_ventas || 0);
      g.totalEfectivo += Number(r.ingresos_efectivo || 0);
      g.totalDigital += Number(r.ingresos_digital || r.transferencias || 0);
      g.resumenes.push(r);
    }

    // Ordenar descendente (más reciente primero)
    return Array.from(grupos.values()).sort((a, b) => b.clave.localeCompare(a.clave));
  }, [datos, tipo]);

  // 🆕 Limitar a 12 meses por default
  const mesesVisibles = useMemo(() => {
    if (verAntiguos) return mesesAgrupados;
    return mesesAgrupados.slice(0, 12);
  }, [mesesAgrupados, verAntiguos]);

  const hayMasMeses = mesesAgrupados.length > 12;

  // Resúmenes del mes seleccionado (para mostrar en la tabla)
  const resumenesDelMes = useMemo(() => {
    if (!mesSeleccionado) return [];
    const grupo = mesesAgrupados.find(g => g.clave === mesSeleccionado);
    return grupo ? grupo.resumenes : [];
  }, [mesSeleccionado, mesesAgrupados]);

  // ¿Estamos en modo "vista de carpetas" o "vista de tabla"?
  const usaAgrupado = tipo === "diario" || tipo === "semanal";
  const mostrarCarpetas = usaAgrupado && !mesSeleccionado;
  const mostrarTabla = !usaAgrupado || (usaAgrupado && mesSeleccionado);

  // Para la tabla: si estamos viendo un mes, mostrar solo sus resúmenes
  const filasTabla = (usaAgrupado && mesSeleccionado) ? resumenesDelMes : datos;

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

      {/* 🆕 BREADCRUMB cuando estamos viendo un mes */}
      {usaAgrupado && mesSeleccionado && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setMesSeleccionado(null)}
            className="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
          >
            ← Volver a meses
          </button>
          <h3 className="text-lg font-semibold text-slate-800">
            🗓️ {formatearNombreMes(mesSeleccionado)}
            <span className="text-sm text-gray-500 font-normal ml-2">
              ({resumenesDelMes.length} {tipo === "diario" ? "días" : "semanas"})
            </span>
          </h3>
        </div>
      )}

      {/* 🆕 VISTA DE CARPETAS (selector de mes) */}
      {mostrarCarpetas && (
        <>
          {mesesVisibles.length === 0 ? (
            <div className="bg-white rounded shadow p-6 text-gray-500">
              No hay resúmenes para mostrar.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Seleccioná un mes para ver el detalle:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {mesesVisibles.map((g, idx) => {
                  const esActual = idx === 0;
                  return (
                    <button
                      key={g.clave}
                      onClick={() => setMesSeleccionado(g.clave)}
                      className={`text-left bg-white rounded-xl shadow p-5 hover:shadow-lg transition hover:-translate-y-0.5 border-l-4 ${
                        esActual ? "border-blue-500" : "border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-slate-800 capitalize">
                          🗓️ {formatearNombreMes(g.clave)}
                        </div>
                        {esActual && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                            Reciente
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 mb-3">
                        {g.cantidad} {tipo === "diario" ? "resúmenes diarios" : "resúmenes semanales"}
                      </div>

                      <div className="border-t pt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ventas:</span>
                          <span className="font-bold text-green-700">{fmt(g.totalVentas)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Efectivo:</span>
                          <span>{fmt(g.totalEfectivo)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Digital:</span>
                          <span>{fmt(g.totalDigital)}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-blue-600 font-medium">
                        Ver detalle →
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 🆕 Botón "Ver más antiguos" */}
              {hayMasMeses && !verAntiguos && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setVerAntiguos(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-full text-sm font-medium"
                  >
                    📂 Ver meses más antiguos ({mesesAgrupados.length - 12} más)
                  </button>
                </div>
              )}

              {verAntiguos && hayMasMeses && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setVerAntiguos(false)}
                    className="text-slate-500 hover:text-slate-700 text-sm underline"
                  >
                    Mostrar solo los últimos 12 meses
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* TABLA (vista detalle del mes O vista clásica para mensual/turno) */}
      {mostrarTabla && (
        filasTabla.length === 0 ? (
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
                {filasTabla.map((r, i) => (
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
        )
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
