import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/dashboardService';

export default function Dashboard() {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";

  const [data, setData] = useState({
    cajaActual: 0,
    ingresosDia: 0,
    ordenesHoy: 0
  });

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500">Caja actual</p>
          <p className="text-2xl font-bold">${data.cajaActual}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500">Ingresos del día</p>
          <p className="text-2xl font-bold">${data.ingresosDia}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500">Órdenes del día</p>
          <p className="text-2xl font-bold">{data.ordenesHoy}</p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">Accesos rápidos</h3>
        <div className="flex flex-wrap gap-4">

          <button
            onClick={() => navigate('/ordenes/nueva')}
            className="bg-blue-600 text-white px-6 py-4 rounded-xl shadow hover:bg-blue-700 text-lg"
          >
            ➕ Nueva orden
          </button>

          <button
            onClick={() => navigate('/ordenes')}
            className="bg-slate-700 text-white px-6 py-4 rounded-xl shadow hover:bg-slate-800 text-lg"
          >
            📦 Órdenes
          </button>

          <button
            onClick={() => navigate('/caja')}
            className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow hover:bg-emerald-700 text-lg"
          >
            💰 Caja
          </button>

          {esAdmin && (
            <button
              onClick={() => navigate('/resumenes')}
              className="bg-purple-600 text-white px-6 py-4 rounded-xl shadow hover:bg-purple-700 text-lg"
            >
              📊 Resúmenes
            </button>
          )}

          <button
            onClick={() => navigate('/retiros')}
            className="bg-yellow-600 text-white px-6 py-4 rounded-xl shadow hover:bg-yellow-700 text-lg"
          >
            💸 Retiros
          </button>

        </div>
      </div>
    </div>
  );
}
