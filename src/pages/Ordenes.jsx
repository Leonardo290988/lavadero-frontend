import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";




export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cargarOrdenes = async () => {
    try {
      const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/ordenes/abiertas");
      const data = await res.json();
      setOrdenes(data);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarOrden = async (id) => {
    if (!confirm(`¿Cerrar la orden #${id}?`)) return;

    try {
      const res = await fetch(`https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/cerrar`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al cerrar orden");
        return;
      }

      cargarOrdenes();
    } catch (error) {
      console.error("Error cerrando orden:", error);
      alert("Error de conexión con el servidor");
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  if (loading) {
    return <p className="p-6">Cargando órdenes...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Órdenes abiertas</h2>

      {ordenes.length === 0 ? (
        <p>No hay órdenes abiertas</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Fecha ingreso</th>
                <th className="px-4 py-3 text-left">Total</th>

                {/* ✅ NUEVA COLUMNA */}
                <th className="px-4 py-3 text-center">Envío</th>

                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">#{o.id}</td>
                  <td className="px-4 py-3">{o.cliente}</td>
                  <td className="px-4 py-3">
  {o.fecha_ingreso}
</td>

                  <td className="px-4 py-3 font-semibold">
                    $
                    {Math.max(
                      Number(o.total || 0) - Number(o.senia || 0),
                      0
                    )}
                  </td>

                  {/* ✅ NUEVO DATO */}
                  <td
                    className="px-4 py-3 text-center font-semibold"
                    style={{ color: o.tiene_envio ? "green" : "gray" }}
                  >
                    {o.tiene_envio ? "SI" : "NO"}
                  </td>

                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/ordenes/${o.id}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Ver detalle
                    </button>

                    <button
                      onClick={() => cerrarOrden(o.id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                    >
                      Cerrar
                    </button>
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