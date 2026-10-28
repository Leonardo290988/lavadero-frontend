import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatearFechaHoraISO } from "../utils/fechas";



export default function OrdenesListas() {

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [procesando, setProcesando] = useState(false);
  const [reimprimiendo, setReimprimiendo] = useState(null);
  const [actualizandoPrecios, setActualizandoPrecios] = useState(null);
  const [descartando, setDescartando] = useState(null);

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
    if (procesando) return;
    setProcesando(true);
    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${ordenSeleccionada}/retirar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metodo_pago: metodoPago,
            usuario_id: usuario?.id
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
    } finally {
      setProcesando(false);
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

  // 🆕 Actualizar los precios de la orden al valor de hoy (retiros muy tardíos)
  const actualizarPrecios = async (id) => {
    if (!window.confirm(
      `¿Actualizar los precios de la orden #${id} al valor de hoy?\n\n` +
      `Se usa para retiros muy tardíos. La multa por días se sigue sumando aparte.`
    )) return;

    setActualizandoPrecios(id);
    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/actualizar-precios`,
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al actualizar precios");
        return;
      }

      alert(
        `Precios actualizados.\nNuevo total (sin multa): $${Number(data.total).toLocaleString("es-AR")}`
      );
      cargarOrdenes();
    } catch (error) {
      console.error("Error actualizando precios:", error);
      alert("Error de conexión");
    } finally {
      setActualizandoPrecios(null);
    }
  };

  // 🆕 Descartar la orden manualmente (sin límite de días, no manda WhatsApp)
  const descartarOrden = async (id) => {
    if (!window.confirm(
      `¿Descartar la orden #${id}?\n\n` +
      `Desaparece de esta lista y no se podrá retirar. Esta acción no se puede deshacer.`
    )) return;

    setDescartando(id);
    try {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/descartar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al descartar la orden");
        return;
      }

      alert("Orden descartada");
      cargarOrdenes();
    } catch (error) {
      console.error("Error descartando orden:", error);
      alert("Error de conexión");
    } finally {
      setDescartando(null);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  if (loading) {
    return <p className="p-6">Cargando órdenes listas...</p>;
  }

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
              {ordenes.map((o) => {
                // 🆕 Usar datos calculados por el backend (no recalcular en frontend)
                const multaPct = Number(o.multa_porcentaje) || 0;
                const multaMonto = Number(o.multa_monto) || 0;
                const diasLista = Number(o.dias_lista) || 0;
                const tieneMulta = multaPct > 0;

                // Color de fila según gravedad
                let rowClass = "";
                if (diasLista >= 60) rowClass = "bg-red-100";
                else if (multaPct >= 20) rowClass = "bg-red-50";
                else if (multaPct >= 10) rowClass = "bg-orange-50";

                return (
                <tr key={o.id} className={`border-t ${rowClass}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>#{o.id}</span>
                      {tieneMulta && (
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${
                          multaPct >= 20 ? "bg-red-600" : "bg-orange-500"
                        }`}>
                          ⚠️ Multa {multaPct}%
                        </span>
                      )}
                      {diasLista >= 60 && (
                        <span className="text-xs bg-red-700 text-white px-2 py-0.5 rounded-full font-semibold">
                          🚨 {diasLista}d
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{o.cliente}</td>
                  <td className="px-4 py-3">
                    {formatearFechaHoraISO(o.fecha_ingreso)}
                    {diasLista > 0 && (
                      <span className="block text-xs text-gray-500">
                        Lista hace {diasLista} {diasLista === 1 ? "día" : "días"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${Number(o.total_a_pagar).toLocaleString("es-AR")}
                    {tieneMulta && (
                      <span className="block text-xs text-red-600 font-normal">
                        (incluye multa {multaPct}%: +${multaMonto.toLocaleString("es-AR")})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2 justify-center">
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

                    {/* 🆕 Acciones de admin para órdenes muy demoradas */}
                    {esAdmin && (
                      <>
                        <button
                          onClick={() => actualizarPrecios(o.id)}
                          disabled={actualizandoPrecios === o.id}
                          className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 disabled:opacity-50"
                        >
                          {actualizandoPrecios === o.id ? "..." : "💲 Actualizar precios"}
                        </button>

                        <button
                          onClick={() => descartarOrden(o.id)}
                          disabled={descartando === o.id}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {descartando === o.id ? "..." : "🗑️ Descartar"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                );
              })}
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
                disabled={procesando}
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {procesando ? "Procesando..." : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
