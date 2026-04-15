import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatearFechaHoraISO } from "../utils/fechas";



export default function OrdenesListas() {

  const usuario = JSON.parse(localStorage.getItem("usuario"));   // ✅ AGREGADO

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [reimprimiendo, setReimprimiendo] = useState(null); // guarda el id que se está reimprimiendo

  const cargarOrdenes = async () => {
    try {
      const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/ordenes/listas");
      const data = await res.json();
      setOrdenes(data);
    } catch (error) {
      console.error("Error cargando órdenes listas:", error);
    } finally {
      setLoading(false);
    }
  };

  const retirarOrden = (id) => {
    setOrdenSeleccionada(id);
    setMetodoPago("Efectivo");
    setMostrarModal(true);
  };

  const confirmarRetiro = async () => {
    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${ordenSeleccionada}/retirar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metodo_pago: metodoPago,
            usuario_id: usuario?.id   // ✅ AGREGADO
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al retirar orden");
        return;
      }

      alert("Orden retirada correctamente");

      window.open(
        `https://lavadero-backend-production-e1eb.up.railway.app/pdf/retiros/retiro_${ordenSeleccionada}.pdf`,
        "_blank"
      );

      setMostrarModal(false);
      setOrdenSeleccionada(null);
      cargarOrdenes();

    } catch (error) {
      console.error("Error retirando orden:", error);
    }
  };

  const reimprimirOrden = async (id) => {
    setReimprimiendo(id);
    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/reimprimir-orden`,
        { method: "POST" }
      );
      if (res.ok) {
        window.open(
          `https://lavadero-backend-production-e1eb.up.railway.app/pdf/ordenes/orden_${id}.pdf?t=${Date.now()}`,
          "_blank"
        );
      } else {
        alert("Error al reimprimir ticket");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setReimprimiendo(null);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  if (loading) {
    return <p className="p-6">Cargando órdenes listas...</p>;
  }

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">
        Órdenes listas para retirar
      </h2>

      {esAdmin && ordenes.length > 0 && (
        <div className="mb-6 inline-block bg-blue-50 border border-blue-200 rounded-lg px-5 py-3">
          <span className="text-sm text-blue-600 font-medium">Total a cobrar: </span>
          <span className="text-xl font-bold text-blue-700">
            ${ordenes.reduce((acc, o) => acc + Number(o.total_a_pagar || 0), 0).toLocaleString("es-AR")}
          </span>
          <span className="text-sm text-blue-500 ml-2">({ordenes.length} órdenes)</span>
        </div>
      )}

      {ordenes.length === 0 ? (
        <p>No hay órdenes listas</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Fecha ingreso</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">#{o.id}</td>
                  <td className="px-4 py-3">{o.cliente}</td>
                  <td className="px-4 py-3">
                    {formatearFechaHoraISO(o.fecha_ingreso)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${o.total_a_pagar}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/ordenes/${o.id}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Ver detalle
                    </button>

                    <button
                      onClick={() => retirarOrden(o.id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                    >
                      Retirar
                    </button>

                    <button
                      onClick={() => reimprimirOrden(o.id)}
                      disabled={reimprimiendo === o.id}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {reimprimiendo === o.id ? "..." : "🖨️ Ticket"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              Seleccionar método de pago
            </h3>

            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia/MercadoPago">
                Transferencia/MercadoPago
              </option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarRetiro}
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}