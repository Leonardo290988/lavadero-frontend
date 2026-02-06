import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) {
      setUsuario(JSON.parse(u));
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        {/* BARRA SUPERIOR */}
        {usuario && (
          <div
            style={{
              background: "#1f2937",
              color: "#fff",
              padding: "8px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px"
            }}
          >
            <span>Usuario: {usuario.nombre}</span>

            <button
              onClick={cerrarSesion}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <Header />

        <main className="p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}