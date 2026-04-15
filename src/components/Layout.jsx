import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Layout() {

  const [usuario, setUsuario] = useState(null);
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passNueva2, setPassNueva2] = useState("");
  const [mensajePass, setMensajePass] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) setUsuario(JSON.parse(u));
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  const cambiarPassword = async () => {
    setMensajePass("");

    if (!passActual || !passNueva || !passNueva2) {
      setMensajePass("Completá todos los campos");
      return;
    }
    if (passNueva !== passNueva2) {
      setMensajePass("Las contraseñas nuevas no coinciden");
      return;
    }
    if (passNueva.length < 4) {
      setMensajePass("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API}/usuarios/cambiar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          password_actual: passActual,
          password_nueva: passNueva
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMensajePass(data.error || "Error al cambiar contraseña");
        return;
      }

      setMensajePass("✅ Contraseña actualizada correctamente");
      setPassActual("");
      setPassNueva("");
      setPassNueva2("");
      setTimeout(() => {
        setMostrarCambioPass(false);
        setMensajePass("");
      }, 2000);

    } catch {
      setMensajePass("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        {/* BARRA SUPERIOR */}
        {usuario && (
          <div style={{
            background: "#1f2937", color: "#fff",
            padding: "8px 16px", display: "flex",
            justifyContent: "space-between", alignItems: "center", fontSize: "14px"
          }}>
            <span>Usuario: {usuario.nombre}</span>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setMostrarCambioPass(true); setMensajePass(""); }}
                style={{
                  background: "#374151", color: "#fff", border: "none",
                  padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
                }}
              >
                🔒 Cambiar contraseña
              </button>

              <button
                onClick={cerrarSesion}
                style={{
                  background: "#dc2626", color: "#fff", border: "none",
                  padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <Header />

        <main className="p-6">
          <Outlet />
        </main>

      </div>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {mostrarCambioPass && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 28,
            width: 340, boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
              🔒 Cambiar contraseña
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#555" }}>Contraseña actual</label>
              <input
                type="password"
                value={passActual}
                onChange={e => setPassActual(e.target.value)}
                style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginTop: 4 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#555" }}>Contraseña nueva</label>
              <input
                type="password"
                value={passNueva}
                onChange={e => setPassNueva(e.target.value)}
                style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginTop: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#555" }}>Repetir contraseña nueva</label>
              <input
                type="password"
                value={passNueva2}
                onChange={e => setPassNueva2(e.target.value)}
                style={{ display: "block", width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", marginTop: 4 }}
              />
            </div>

            {mensajePass && (
              <p style={{ fontSize: 13, color: mensajePass.startsWith("✅") ? "green" : "red", marginBottom: 12 }}>
                {mensajePass}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setMostrarCambioPass(false); setMensajePass(""); }}
                style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={cambiarPassword}
                disabled={guardando}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#1f2937", color: "#fff", border: "none", cursor: "pointer", opacity: guardando ? 0.6 : 1 }}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
