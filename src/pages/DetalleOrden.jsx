import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatearFechaHoraISO } from "../utils/fechas";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function DetalleOrden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const [senia, setSenia] = useState(0);
  const [formaPagoSenia, setFormaPagoSenia] = useState("efectivo");
  const [notas, setNotas] = useState("");
  const [reimprimiendo, setReimprimiendo] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esAdmin = usuario?.rol === "admin";

  const cargarDetalle = async () => {
    const res = await fetch(`${API}/ordenes/${id}/detalle`);
    const data = await res.json();
    setOrden(data);
    setSenia(Number(data.senia) || 0);
    setNotas(data.notas || "");
  };

  useEffect(() => {
    const init = async () => {
      try {
        await cargarDetalle();
      } catch (error) {
        console.error("Error cargando detalle:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const res = await fetch(`${API}/servicios`);
        const data = await res.json();
        setServicios(data);
      } catch (error) {
        console.error("Error cargando servicios:", error);
      }
    };
    cargarServicios();
  }, []);

  const agregarServicio = async () => {
    if (!servicioId || cantidad <= 0) return;
    await fetch(`${API}/ordenes/${id}/servicios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicio_id: servicioId, cantidad }),
    });
    await cargarDetalle();
    setCantidad(1);
    setServicioId("");
    // Si la orden ya estaba confirmada, regenerar el ticket automáticamente
    if (orden?.estado === "confirmada") {
      await fetch(`${API}/ordenes/${id}/reimprimir-orden`, { method: "POST" });
    }
  };

  const guardarSenia = async (valor, forma) => {
    await fetch(`${API}/ordenes/${id}/senia`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senia: valor, forma_pago_senia: forma || formaPagoSenia }),
    });
    await cargarDetalle();
  };

  const guardarNotas = async (valor) => {
    await fetch(`${API}/ordenes/${id}/notas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas: valor }),
    });
  };

  const eliminarServicio = async (ordenServicioId) => {
    if (!window.confirm("¿Eliminar este servicio?")) return;
    await fetch(`${API}/ordenes/servicios/${ordenServicioId}`, {
      method: "DELETE",
    });
    await cargarDetalle();
    // Si la orden ya estaba confirmada, regenerar el ticket automáticamente
    if (orden?.estado === "confirmada") {
      await fetch(`${API}/ordenes/${id}/reimprimir-orden`, { method: "POST" });
    }
  };

  const confirmarOrden = async () => {
    const res = await fetch(`${API}/ordenes/${id}/confirmar`, {
      method: "POST",
    });

    if (res.ok) {
      const url = `${API}/pdf/ordenes/orden_${id}.pdf`;
      window.open(url, "_blank");
      setTimeout(() => {
        window.open(`${API}/pdf/ordenes/ropa_${id}.pdf`, "_blank");
      }, 500);
      alert("Orden confirmada y tickets generados");
      await cargarDetalle();
    } else {
      const data = await res.json();
      alert(data.error || "Error al confirmar orden");
    }
  };

  const reimprimirOrden = async () => {
    setReimprimiendo(true);
    try {
      const res = await fetch(`${API}/ordenes/${id}/reimprimir-orden`, {
        method: "POST",
      });
      if (res.ok) {
        const t = Date.now();
        window.open(`${API}/pdf/ordenes/orden_${id}.pdf?t=${t}`, "_blank");
        setTimeout(() => {
          window.open(`${API}/pdf/ordenes/ropa_${id}.pdf?t=${t}`, "_blank");
        }, 500);
      } else {
        alert("Error al reimprimir el ticket");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setReimprimiendo(false);
    }
  };

  const reimprimirRetiro = async () => {
    setReimprimiendo(true);
    try {
      const res = await fetch(`${API}/ordenes/${id}/reimprimir-retiro`, {
        method: "POST",
      });
      if (res.ok) {
        const url = `${API}/pdf/retiros/retiro_${id}.pdf?t=${Date.now()}`;
        window.open(url, "_blank");
      } else {
        alert("Error al reimprimir el ticket de retiro");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setReimprimiendo(false);
    }
  };

  const handleEliminarOrden = async () => {
    if (!window.confirm(`¿Seguro que querés eliminar la orden #${orden.orden_id}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API}/ordenes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensaje);
        window.history.back();
      } else {
        alert(data.error || "Error al eliminar la orden");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setEliminando(false);
    }
  };

  // Promo 3x2 según el día de INGRESO de la orden (no el día actual)
  const promoActivaEnFecha = (fechaIngreso) => {
    if (!fechaIngreso) return false;
    const fecha = new Date(fechaIngreso);
    const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" }).toLowerCase();
    return ["martes", "miércoles", "jueves", "viernes"].includes(dia);
  };

  const calcularTotalEstimado = () => {
    if (!orden?.servicios) return 0;
    let total = 0;
    orden.servicios.forEach((s) => {
      total += Number(s.precio_unitario) * Number(s.cantidad);
    });

    if (promoActivaEnFecha(orden.fecha_ingreso)) {
      const acolchados = [];
      const camperones = [];
      orden.servicios.forEach((s) => {
        const nombre = s.nombre.toLowerCase();
        const precio = Number(s.precio_unitario);
        const cant = Number(s.cantidad);
        if (nombre.includes("acolchado") || nombre.includes("frazada")) {
          for (let i = 0; i < cant; i++) acolchados.push(precio);
        } else if (nombre.includes("camperon") || nombre.includes("camperón")) {
          for (let i = 0; i < cant; i++) camperones.push(precio);
        }
      });
      const calcDescGrupo = (arr) => {
        arr.sort((a, b) => b - a);
        let desc = 0, left = 0, right = arr.length - 1, count = 0;
        while (left < right) {
          count++;
          if (count === 2) { desc += arr[right]; right--; count = 0; }
          else { left++; }
        }
        return desc;
      };
      total -= calcDescGrupo(acolchados) + calcDescGrupo(camperones);
    }

    return total;
  };

  if (loading) return <p className="p-6">Cargando orden...</p>;
  if (!orden) return <p className="p-6">Orden no encontrada</p>;

  const esConfirmada = orden.estado === "confirmada";
  const esRetirada = orden.estado === "retirada";
  const esCerrada = ["lista", "retirada", "entregada"].includes(orden.estado);

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Orden #{orden.orden_id}</h2>

      {/* DATOS ORDEN */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <p><b>Cliente:</b> {orden.cliente}</p>
        <p><b>Creada por:</b> {orden.usuario}</p>
        <p><b>Estado:</b> {orden.estado}</p>
        <p>
          <b>Ingreso:</b>{" "}
          {formatearFechaHoraISO(orden.fecha_ingreso)}
        </p>

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <b>Seña:</b>
          <input
            type="number"
            className="border rounded px-3 py-1 w-32"
            value={senia}
            onChange={(e) => setSenia(Number(e.target.value))}
            onBlur={() => guardarSenia(senia)}
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={formaPagoSenia}
            onChange={(e) => {
              setFormaPagoSenia(e.target.value);
              if (senia > 0) guardarSenia(senia, e.target.value);
            }}
          >
            <option value="efectivo">💵 Efectivo</option>
            <option value="transferencia">📱 Transferencia / MP</option>
          </select>
        </div>

        <div className="mt-3">
          <b>Notas / Observaciones:</b>
          <textarea
            className="border rounded px-3 py-2 w-full mt-1 text-sm"
            rows={3}
            placeholder="Ej: acolchado con mancha en la esquina, no planchar, etc."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={() => guardarNotas(notas)}
          />
        </div>

        <p className="mt-2">
          <b>Total estimado:</b> ${Math.max(calcularTotalEstimado() - senia, 0)}
        </p>
        {orden.descuento_fidelidad > 0 && (
          <p className="mt-1 text-green-700 font-semibold text-sm">
            🏆 Descuento fidelidad {orden.descuento_fidelidad}% aplicado al cerrar la orden
          </p>
        )}
        <p className="text-sm text-gray-500">
          * El total final se confirma al cerrar la orden
        </p>

        {/* BOTONES DE ACCIÓN */}
        <div className="mt-4 flex flex-wrap gap-2">
          {orden.estado === "ingresado" && (
            <button
              onClick={confirmarOrden}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Confirmar Orden
            </button>
          )}

          {(esConfirmada || esRetirada) && (
            <button
              onClick={reimprimirOrden}
              disabled={reimprimiendo}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              🖨️ {reimprimiendo ? "Generando..." : "Reimprimir ticket ingreso"}
            </button>
          )}

          {esRetirada && (
            <button
              onClick={reimprimirRetiro}
              disabled={reimprimiendo}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
            >
              🖨️ {reimprimiendo ? "Generando..." : "Reimprimir ticket retiro"}
            </button>
          )}

          {esAdmin && ['ingresado', 'confirmada'].includes(orden.estado) && (
            <button
              onClick={handleEliminarOrden}
              disabled={eliminando}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {eliminando ? "Eliminando..." : "🗑️ Eliminar orden"}
            </button>
          )}

          {esConfirmada && (
            <button
              onClick={() => navigate("/ordenes")}
              className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
            >
              ✅ Aceptar
            </button>
          )}
        </div>
      </div>

      {/* AGREGAR SERVICIO — solo si la orden no está cerrada */}
      {!esCerrada && (
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Agregar servicio</h3>
        <div className="flex gap-3">
          {/* Dropdown personalizado */}
          <div className="relative flex-1">
            <div
              className="border rounded px-3 py-2 cursor-pointer bg-white flex justify-between items-center"
              onClick={() => setDropdownAbierto(!dropdownAbierto)}
            >
              <span className={servicioId ? "" : "text-gray-400"}>
                {servicioId
                  ? (() => {
                      const s = servicios.find(s => String(s.id) === String(servicioId));
                      return s ? s.nombre : "Seleccionar servicio";
                    })()
                  : "Seleccionar servicio"}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </div>
            {dropdownAbierto && (
              <div className="absolute z-50 w-full bg-white border rounded shadow-lg max-h-64 overflow-y-auto mt-1">
                <div
                  className="px-3 py-2 text-gray-400 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setServicioId(""); setDropdownAbierto(false); }}
                >
                  Seleccionar servicio
                </div>
                {servicios.map((s) => {
                  const match = s.nombre.match(/^(.*?Acolchado\s*)(.+)$/i);
                  return (
                    <div
                      key={s.id}
                      className={`px-3 py-2 hover:bg-blue-50 cursor-pointer ${String(servicioId) === String(s.id) ? "bg-blue-100" : ""}`}
                      onClick={() => { setServicioId(s.id); setDropdownAbierto(false); }}
                    >
                      {match
                        ? <>{match[1]}<strong>{match[2]}</strong></>
                        : s.nombre}
                      <span className="text-gray-400 text-sm ml-1">(${Number(s.precio).toLocaleString("es-AR")})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <input
            type="number"
            min="1"
            className="border rounded px-3 py-2 w-24"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
          <button
            onClick={agregarServicio}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Agregar
          </button>
        </div>
      </div>
      )}

      {/* LISTADO SERVICIOS */}
      <h3 className="font-semibold mb-2">Servicios</h3>
      {orden.servicios.length === 0 ? (
        <p>No hay servicios cargados</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Servicio</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Subtotal</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orden.servicios.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{s.nombre}</td>
                <td className="px-4 py-2 text-center">{s.cantidad}</td>
                <td className="px-4 py-2 text-center">${s.precio_unitario}</td>
                <td className="px-4 py-2 text-center">${s.subtotal}</td>
                <td className="px-4 py-2 text-center">
                  {!esCerrada && (
                    <button
                      onClick={() => eliminarServicio(s.orden_servicio_id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
