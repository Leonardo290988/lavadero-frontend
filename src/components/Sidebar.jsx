import { Link, useLocation } from "react-router-dom";
import { Home, DollarSign, Package, BarChart2, Settings, CheckCircle, Truck } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  // Leer el usuario logueado del localStorage
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";

  const itemClass = (path) =>
    `flex items-center gap-3 p-2 rounded-lg transition ${
      location.pathname === path
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold">
          LM
        </div>
        <div>
          <h1 className="font-bold text-lg">Lavaderos Moreno</h1>
          <p className="text-xs text-slate-400">Sistema de gestión</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        <Link to="/" className={itemClass("/")}>
          <Home size={18} /> Dashboard
        </Link>

        <Link to="/caja" className={itemClass("/caja")}>
          <DollarSign size={18} /> Caja
        </Link>

        <Link to="/ordenes" className={itemClass("/ordenes")}>
          <Package size={18} /> Órdenes
        </Link>

        <Link to="/ordenes-listas" className={itemClass("/ordenes-listas")}>
          <CheckCircle size={18} /> Listas para retirar
        </Link>

        <Link to="/solicitudes-retiro" className={itemClass("/solicitudes-retiro")}>
          <Truck size={18} /> Retiros a Domicilio
        </Link>

        <Link to="/envios" className={itemClass("/envios")}>
          <Truck size={18} /> Envíos a Domicilio
        </Link>

        <Link to="/envios-entregados" className={itemClass("/envios-entregados")}>
          <Truck size={18} /> Envíos entregados
        </Link>

        {/* Solo visible para admins */}
        {esAdmin && (
          <Link to="/resumenes" className={itemClass("/resumenes")}>
            <BarChart2 size={18} /> Resúmenes
          </Link>
        )}

        {esAdmin && (
          <Link to="/estadisticas" className={itemClass("/estadisticas")}>
            <BarChart2 size={18} /> Estadísticas
          </Link>
        )}

        {esAdmin && (
          <Link to="/puntos" className={itemClass("/puntos")}>
            <span style={{fontSize:18}}>🏆</span> Puntos clientes
          </Link>
        )}

        <Link to="/clientes-inactivos" className={itemClass("/clientes-inactivos")}>
          <span style={{fontSize:18}}>📵</span> Clientes inactivos
        </Link>

        <Link to="/ordenes-sin-retirar" className={itemClass("/ordenes-sin-retirar")}>
          <span style={{fontSize:18}}>⏳</span> Sin retirar
        </Link>

        <Link to="/configuracion" className={itemClass("/configuracion")}>
          <Settings size={18} /> Configuración
        </Link>
      </nav>
    </aside>
  );
}