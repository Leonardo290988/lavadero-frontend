import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function OrdenesSinRetirar() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/ordenes/sin-retirar`)
      .then(r => r.json())
      .then(data => setOrdenes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const enviarRecordatorio = async (o) => {
    const tel = o.telefono?.replace(/\D/g, "");
    if (!tel) { alert("El cliente no tiene teléfono registrado"); return; }

    const saldo = Number(o.saldo);
    const multa = o.dias_lista > 30 ? Math.floor(Number(o.total) * 0.10) : 0;

    const mensaje = `🧺 *Lavaderos Moreno*

Hola ${o.cliente}! 👋
Te recordamos que tu orden *#${o.id}* está lista para retirar 🧺

💵 Saldo a abonar: *$${saldo}*${multa > 0 ? `\n⚠️ Multa por almacenamiento: *+$${multa}*` : ""}

📍 Hipólito Yrigoyen 1471, Moreno
🕐 Lunes a Sábados de 9 a 18hs

⚠️ Recordá que pasados los 30 días se cobra una multa por almacenamiento.`;

    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");

    // Registrar recordatorio
    try {
      await fetch(`${API}/ordenes/${o.id}/recordatorio`, { method: "POST" });
      setOrdenes(prev => prev.map(ord =>
        ord.id === o.id
          ? { ...ord, ultimo_recordatorio: new Date().toISOString() }
          : ord
      ));
    } catch {
      console.error("Error registrando recordatorio");
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">⏳ Órdenes sin retirar</h2>
      <p className="text-gray-500 text-sm mb-6">
        Órdenes listas hace más de 10 días — {ordenes.length} encontradas
      </p>

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
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o, i) => {
                const puede = puedeEnviar(o.ultimo_recordatorio);
                const faltan = diasRestantes(o.ultimo_recordatorio);
                const tieneMulta = o.dias_lista > 30;
                return (
                  <tr key={i} className={`border-t ${tieneMulta ? "bg-red-50" : ""}`}>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tieneMulta ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {o.dias_lista} días
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${Number(o.saldo).toLocaleString("es-AR")}
                      {tieneMulta && (
                        <span className="block text-xs text-red-600 font-normal">
                          + multa ${Math.floor(Number(o.total) * 0.10).toLocaleString("es-AR")}
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
