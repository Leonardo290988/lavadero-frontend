import { useEffect, useRef, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";
const POLL_MS = 10000; // revisar cada 10 segundos

// Suena un beep corto cuando llega una notificación nueva (sin archivos externos)
function reproducirBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Silencioso si el navegador no permite audio todavía
  }
}

// Convierte un chat_id de WhatsApp a número limpio para el link wa.me
function telefonoDesde(notif) {
  if (notif.telefono) return notif.telefono.replace(/\D/g, "");
  // Fallback: extraer del chat_id (ej: "549112233@c.us")
  const m = (notif.chat_id || "").match(/^(\d+)@/);
  return m ? m[1] : null;
}

function tiempoTranscurrido(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `hace ${hs} h`;
  const dias = Math.floor(hs / 24);
  return `hace ${dias} d`;
}

export default function NotificacionesOperador() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const ultimoCountRef = useRef(0);

  const cargar = async () => {
    try {
      const res = await fetch(`${API}/operador/pendientes`);
      if (!res.ok) return;
      const data = await res.json();
      const lista = data.notificaciones || [];

      // Si llegaron notificaciones nuevas, sonar beep
      if (lista.length > ultimoCountRef.current) {
        reproducirBeep();
      }
      ultimoCountRef.current = lista.length;

      setNotificaciones(lista);
    } catch {
      // Silencioso: si el backend no responde, reintenta en el próximo poll
    }
  };

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, POLL_MS);
    return () => clearInterval(intervalo);
  }, []);

  const atender = async (id) => {
    try {
      await fetch(`${API}/operador/${id}/atender`, { method: "POST" });
      setNotificaciones(prev => {
        const nueva = prev.filter(n => n.id !== id);
        ultimoCountRef.current = nueva.length;
        return nueva;
      });
    } catch {
      // Silencioso
    }
  };

  const abrirWhatsApp = (notif) => {
    const tel = telefonoDesde(notif);
    if (tel) {
      window.open(`https://wa.me/${tel}`, "_blank");
    } else {
      window.open("https://web.whatsapp.com", "_blank");
    }
  };

  const cantidad = notificaciones.length;

  return (
    <div style={{ position: "relative" }}>
      {/* Campana */}
      <button
        onClick={() => setAbierto(a => !a)}
        title="Clientes esperando operador"
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          position: "relative", padding: "4px 8px", fontSize: "20px", lineHeight: 1
        }}
      >
        🔔
        {cantidad > 0 && (
          <span style={{
            position: "absolute", top: -2, right: 0,
            background: "#dc2626", color: "#fff", fontSize: "11px", fontWeight: "bold",
            minWidth: 18, height: 18, borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px"
          }}>
            {cantidad}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {abierto && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 340, maxHeight: 420, overflowY: "auto",
          background: "#fff", color: "#111", borderRadius: 10,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)", zIndex: 2000,
          border: "1px solid #e5e7eb"
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid #eee",
            fontWeight: "bold", fontSize: 14, display: "flex",
            justifyContent: "space-between", alignItems: "center"
          }}>
            <span>Clientes esperando operador</span>
            <span style={{ color: "#888", fontWeight: "normal" }}>{cantidad}</span>
          </div>

          {cantidad === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#888", fontSize: 13 }}>
              No hay clientes esperando 🎉
            </div>
          )}

          {notificaciones.map(n => (
            <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: "bold", fontSize: 14 }}>
                  {n.nombre_cliente || "Cliente"}
                </span>
                <span style={{ fontSize: 11, color: "#999" }}>
                  {tiempoTranscurrido(n.fecha_pedido)}
                </span>
              </div>

              {n.mensaje_cliente && (
                <p style={{
                  fontSize: 12, color: "#555", margin: "4px 0 8px",
                  whiteSpace: "pre-wrap", wordBreak: "break-word"
                }}>
                  {n.mensaje_cliente.length > 120
                    ? n.mensaje_cliente.slice(0, 120) + "…"
                    : n.mensaje_cliente}
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => abrirWhatsApp(n)}
                  style={{
                    flex: 1, background: "#25D366", color: "#fff", border: "none",
                    padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold"
                  }}
                >
                  💬 Abrir WhatsApp
                </button>
                <button
                  onClick={() => atender(n.id)}
                  style={{
                    flex: 1, background: "#1f2937", color: "#fff", border: "none",
                    padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12
                  }}
                >
                  ✓ Atendido
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
