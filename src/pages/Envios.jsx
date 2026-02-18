import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Envios() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const cargarEnvios = async () => {
    try {
      const res = await fetch(
        "https://lavadero-backend-production-e1eb.up.railway.app/envios/pendientes"
      );
      const data = await res.json();
      setEnvios(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando envíos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEnvios();
  }, []);

  // 🔥 NUEVO: Marcar entregado
  const marcarEntregado = async (id) => {
    if (!confirm("¿Confirmar entrega del envío?")) return;

    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/envios/${id}/entregar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metodo_pago: "Efectivo", // podés cambiarlo si querés selector después
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al marcar entregado");
        return;
      }

      alert("✅ Envío entregado correctamente");
      cargarEnvios(); // refresca lista
    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor");
    }
  };

  if (loading) return <p className="p-6">Cargando envíos...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Envíos a domicilio</h2>

      {envios.length === 0 ? (
        <p>No hay envíos pendientes</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {envios.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">#{e.id}</td>
                  <td className="px-4 py-3">{e.cliente}</td>
                  <td className="px-4 py-3">{e.direccion}</td>
                  <td className="px-4 py-3">Zona {e.zona}</td>
                  <td className="px-4 py-3">
                    {e.orden_id ? `#${e.orden_id}` : "-"}
                  </td>

                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    {e.orden_id && (
                      <>
                        <button
                          onClick={() => navigate(`/ordenes/${e.orden_id}`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Ver orden
                        </button>

                        <button
                          onClick={() => marcarEntregado(e.id)}
                          className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                        >
                          Entregado
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}