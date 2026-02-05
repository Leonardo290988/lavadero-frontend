import { useEffect, useState } from "react";

export default function EnviosEntregados() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/envios/entregados");
      const data = await res.json();
      setEnvios(data);
    } catch {
      alert("Error cargando envíos entregados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Envíos entregados</h2>

      {envios.length === 0 ? (
        <p>No hay envíos entregados</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2">ID</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Dirección</th>
              <th className="p-2">Zona</th>
              <th className="p-2">Orden</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {envios.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-2">#{e.id}</td>
                <td className="p-2">{e.cliente}</td>
                <td className="p-2">{e.direccion}</td>
                <td className="p-2">Zona {e.zona}</td>
                <td className="p-2">#{e.orden_id}</td>
                <td className="p-2">${e.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}