import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function OrdenesSinRetirar() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cargarOrdenes = () => {
    setLoading(true);
    fetch(`${API}/ordenes/sin-retirar`)
      .then(r => r.json())
      .then(data => setOrdenes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const puedeEnviar = (ultimo_recordatorio) => {
    if (!ultimo_recordatorio) return true;
    const dias = Math.floor((new Date() - new Date(ultimo_recordatorio)) / (1000 * 60 * 60 * 24));
    return dias >= 10;
  };

  const diasRestantes = (ultimo_recordatorio) => {
    if (!ultimo_recordatorio) return 0;
    const dias = Math.floor((new Date() - new Date(ultimo_recordatorio)) / (1000 * 60 * 60 * 24));
    return 10 - dias;
  };

  // 🆕 Devuelve la "etapa" de la orden según los días
  const obtenerEtapa = (dias) => {
    if (dias >= 90) return { nivel: "descartar", color: "gray", label: "🗑️ A descartar" };
    if (dias >= 60) return { nivel: "ultimo_aviso", color: "red", label: "🚨 Último aviso" };
    if (dias >= 45) return { nivel: "multa20", color: "red", label: "⚠️ Multa 20%" };
    if (dias >= 30) return { nivel: "multa10", color: "orange", label: "⚠️ Multa 10%" };
    return { nivel: "normal", color: "amber", label: "⏳ Pendiente" };
  };

  const enviarRecordatorio = async (o) => {
    const tel = o.telefono?.replace(/\D/g, "");
    if (!tel) { alert("El cliente no tiene teléfono registrado"); return; }

    const total = Number(o.total) || 0;
    const senia = Number(o.senia) || 0;
    const multaPct = Number(o.multa_porcentaje) || 0;
    const multa = Number(o.multa_monto) || 0;
    const saldoConMulta = total + multa - senia;

    const etapa = obtenerEtapa(o.dias_lista);

    let mensaje;

    if (etapa.nivel === "ultimo_aviso") {
      mensaje = `🧺 *Lavaderos Moreno*

Hola ${o.cliente} ⚠️

*ÚLTIMO AVISO IMPORTANTE*

Tu orden *#${o.id}* lleva *${o.dias_lista} días lista* sin retirar.

🚨 *A los 90 días la orden será descartada y ya NO podrás reclamarla.*

Saldo a abonar (con multa del ${multaPct}%): *$${saldoConMulta.toLocaleString("es-AR")}*

Te quedan *${90 - o.dias_lista} días* para retirarla. Después perderás la ropa y el dinero abonado.

Por favor, pasá lo antes posible 🙏
📍 Hipólito Yrigoyen 1471, Moreno
🕐 Lunes a Sábados de 9 a 18hs`;
    } else if (multaPct > 0) {
      mensaje = `🧺 *Lavaderos Moreno*

Hola ${o.cliente}! 👋

Te recordamos que tu orden *#${o.id}* lleva *${o.dias_lista} días lista* sin retirar.

Por almacenamiento se aplicó multa del *${multaPct}%*:
• Total original: $${total.toLocaleString("es-AR")}
• Multa (${multaPct}%): +$${multa.toLocaleString("es-AR")}
• Saldo a abonar: *$${saldoConMulta.toLocaleString("es-AR")}*

${multaPct < 20 ? "⚠️ A los *45 días* la multa subirá al *20%*.\n" : ""}⚠️ A los *90 días* perderás el derecho a reclamar la orden.

Te esperamos 😊
📍 Hipólito Yrigoyen 1471, Moreno
🕐 Lunes a Sábados de 9 a 18hs`;
    } else {
      mensaje = `🧺 *Lavaderos Moreno*

Hola ${o.cliente}! 👋
Te recordamos que tu orden *#${o.id}* está lista para retirar 🧺

💵 Saldo a abonar: *$${saldoConMulta.toLocaleString("es-AR")}*

📍 Hipólito Yrigoyen 1471, Moreno
🕐 Lunes a Sábados de 9 a 18hs

⚠️ Recordá que pasados los 30 días se cobra una multa por almacenamiento.`;
    }

    try {
      const res = await fetch(`${API}/whatsapp/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: tel, mensaje })
      });
      const data = await res.json();

      if (data.automatico) {
        alert("✅ Recordatorio enviado automáticamente");
      } else {
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
      }

      await fetch(`${API}/ordenes/${o.id}/recordatorio`, { method: "POST" });
      setOrdenes(prev => prev.map(ord =>
        ord.id === o.id
          ? { ...ord, ultimo_recordatorio: new Date().toISOString() }
          : ord
      ));
    } catch {
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
    }
  };

  // 🆕 Disparar revisión manual de multas
  const ejecutarRevisionAhora = async () => {
    if (!window.confirm(
      "Esto va a ejecutar la revisión de multas inmediatamente:\n\n" +
      "• Aplicar multas 10% (30+ días)\n" +
      "• Aplicar multas 20% (45+ días)\n" +
      "• Enviar último aviso (60+ días)\n" +
      "• Descartar órdenes (90+ días)\n\n" +
      "Se enviarán WhatsApps automáticamente. ¿Continuar?"
    )) return;

    try {
      const res = await fetch(`${API}/ordenes/multas/ejecutar-ahora`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ Revisión ejecutada. Recargando lista...");
        cargarOrdenes();
      } else {
        alert("Error: " + (data.error || "no se pudo ejecutar"));
      }
    } catch (e) {
      alert("Error de conexión: " + e.message);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  // Contadores por etapa
  const contadores = {
    normal: 0,
    multa10: 0,
    multa20: 0,
    ultimo_aviso: 0,
    descartar: 0,
  };
  ordenes.forEach(o => {
    const e = obtenerEtapa(o.dias_lista);
    contadores[e.nivel]++;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-2xl font-bold">⏳ Órdenes sin retirar</h2>
        <button
          onClick={ejecutarRevisionAhora}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-medium"
          title="Ejecuta el cron de multas inmediatamente sin esperar al día siguiente"
        >
          🔄 Ejecutar revisión de multas ahora
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-4">
        Órdenes listas hace más de 10 días — {ordenes.length} encontradas
      </p>

      {/* 🆕 Resumen por etapa */}
      {ordenes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded">
            <div className="text-xs text-amber-700 font-semibold">Pendientes</div>
            <div className="text-2xl font-bold text-amber-900">{contadores.normal}</div>
            <div className="text-xs text-amber-600">10-29 días</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3 rounded">
            <div className="text-xs text-orange-700 font-semibold">Multa 10%</div>
            <div className="text-2xl font-bold text-orange-900">{contadores.multa10}</div>
            <div className="text-xs text-orange-600">30-44 días</div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <div className="text-xs text-red-700 font-semibold">Multa 20%</div>
            <div className="text-2xl font-bold text-red-900">{contadores.multa20}</div>
            <div className="text-xs text-red-600">45-59 días</div>
          </div>
          <div className="bg-red-100 border border-red-300 p-3 rounded">
            <div className="text-xs text-red-800 font-semibold">Último aviso</div>
            <div className="text-2xl font-bold text-red-900">{contadores.ultimo_aviso}</div>
            <div className="text-xs text-red-700">60-89 días</div>
          </div>
          <div className="bg-gray-100 border border-gray-300 p-3 rounded">
            <div className="text-xs text-gray-700 font-semibold">A descartar</div>
            <div className="text-2xl font-bold text-gray-900">{contadores.descartar}</div>
            <div className="text-xs text-gray-600">90+ días</div>
          </div>
        </div>
      )}

      {ordenes.length === 0 ? (
        <p className="text-gray-500">No hay órdenes pendientes de retiro.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-center">Días lista</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o, i) => {
                const puede = puedeEnviar(o.ultimo_recordatorio);
                const faltan = diasRestantes(o.ultimo_recordatorio);
                const etapa = obtenerEtapa(o.dias_lista);
                const multaPct = Number(o.multa_porcentaje) || 0;
                const multaMonto = Number(o.multa_monto) || 0;
                const saldo = Number(o.saldo) || 0;

                let rowClass = "";
                if (etapa.nivel === "descartar") rowClass = "bg-gray-100";
                else if (etapa.nivel === "ultimo_aviso") rowClass = "bg-red-100";
                else if (etapa.nivel === "multa20") rowClass = "bg-red-50";
                else if (etapa.nivel === "multa10") rowClass = "bg-orange-50";

                return (
                  <tr key={i} className={`border-t ${rowClass}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/ordenes/${o.id}`)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        #{o.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">{o.cliente}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{o.dias_lista} días</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        etapa.color === "gray" ? "bg-gray-200 text-gray-800" :
                        etapa.color === "red" ? "bg-red-200 text-red-800" :
                        etapa.color === "orange" ? "bg-orange-200 text-orange-800" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {etapa.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${saldo.toLocaleString("es-AR")}
                      {multaPct > 0 && (
                        <span className="block text-xs text-red-600 font-normal">
                          (incluye multa {multaPct}%: +${multaMonto.toLocaleString("es-AR")})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {puede ? (
                        <button
                          onClick={() => enviarRecordatorio(o)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          💬 Recordatorio
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Disponible en {faltan} días
                        </span>
                      )}
                    </td>
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
