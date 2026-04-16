import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

const fmtPesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;

export default function Estadisticas() {
  const [servicios, setServicios] = useState([]);
  const [dias, setDias] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [semanal, setSemanal] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/estadisticas/servicios-mas-vendidos`).then(r => r.json()),
      fetch(`${API}/estadisticas/dias-mas-movidos`).then(r => r.json()),
      fetch(`${API}/estadisticas/ticket-promedio`).then(r => r.json()),
      fetch(`${API}/estadisticas/comparativa-semanal`).then(r => r.json()),
      fetch(`${API}/estadisticas/clientes-nuevos-vs-recurrentes`).then(r => r.json()),
    ]).then(([s, d, t, sem, c]) => {
      setServicios(s);
      setDias(d);
      setTickets(t);
      setSemanal(sem);
      setClientes(c);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Cargando estadísticas...</p>;

  const maxOrdenes = Math.max(...dias.map(d => Number(d.total_ordenes)), 1);
  const maxSemanal = Math.max(...semanal.map(s => Number(s.total_facturado)), 1);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">📊 Estadísticas</h2>

      {/* ---- SERVICIOS MÁS VENDIDOS ---- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">🏅 Servicios más vendidos</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Servicio</th>
              <th className="px-4 py-2 text-center">Unidades</th>
              <th className="px-4 py-2 text-center">En órdenes</th>
              <th className="px-4 py-2 text-right">Facturado</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-medium">
                  {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}{s.nombre}
                </td>
                <td className="px-4 py-2 text-center">{s.cantidad_total}</td>
                <td className="px-4 py-2 text-center">{s.en_ordenes}</td>
                <td className="px-4 py-2 text-right">{fmtPesos(s.monto_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- DÍAS MÁS MOVIDOS ---- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">📅 Días más movidos</h3>
        <div className="space-y-3">
          {dias.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium capitalize">
                {d.dia_nombre}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(Number(d.total_ordenes) / maxOrdenes) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">{d.total_ordenes}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500 w-28 text-right">
                prom. {fmtPesos(d.ticket_promedio)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- TICKET PROMEDIO POR MES ---- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">💰 Ticket promedio por mes</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Mes</th>
              <th className="px-4 py-2 text-center">Órdenes</th>
              <th className="px-4 py-2 text-center">Ticket promedio</th>
              <th className="px-4 py-2 text-right">Total facturado</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2 font-medium">{t.mes}</td>
                <td className="px-4 py-2 text-center">{t.total_ordenes}</td>
                <td className="px-4 py-2 text-center">{fmtPesos(t.ticket_promedio)}</td>
                <td className="px-4 py-2 text-right font-semibold">{fmtPesos(t.total_facturado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- COMPARATIVA SEMANAL ---- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">📈 Comparativa semanal (últimas 8 semanas)</h3>
        <div className="space-y-3">
          {semanal.map((s, i) => {
            const fecha = new Date(s.semana);
            const label = `Sem. ${fecha.getDate()}/${fecha.getMonth() + 1}`;
            const esUltima = i === semanal.length - 1;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-6 rounded-full flex items-center justify-end pr-2 ${esUltima ? "bg-green-500" : "bg-slate-400"}`}
                    style={{ width: `${(Number(s.total_facturado) / maxSemanal) * 100}%` }}
                  >
                    <span className="text-white text-xs font-bold">{s.total_ordenes}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-28 text-right">
                  {fmtPesos(s.total_facturado)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- CLIENTES NUEVOS VS RECURRENTES ---- */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-4">👥 Clientes nuevos vs recurrentes</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Mes</th>
              <th className="px-4 py-2 text-center text-green-700">Nuevos</th>
              <th className="px-4 py-2 text-center text-blue-700">Recurrentes</th>
              <th className="px-4 py-2 text-center">% Nuevos</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c, i) => {
              const total = Number(c.clientes_nuevos) + Number(c.clientes_recurrentes);
              const pct = total > 0 ? Math.round((Number(c.clientes_nuevos) / total) * 100) : 0;
              return (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2 font-medium">{c.mes}</td>
                  <td className="px-4 py-2 text-center text-green-700 font-semibold">{c.clientes_nuevos}</td>
                  <td className="px-4 py-2 text-center text-blue-700 font-semibold">{c.clientes_recurrentes}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pct > 30 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
