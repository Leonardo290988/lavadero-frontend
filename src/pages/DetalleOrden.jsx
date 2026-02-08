import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatearFechaHoraISO } from "../utils/fechas";





export default function DetalleOrden() {
  const { id } = useParams();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [senia, setSenia] = useState(0);

  const cargarDetalle = async () => {
    const res = await fetch(`https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/detalle`);
    const data = await res.json();
  
    
    setOrden(data);
    setSenia(Number(data.senia) || 0);
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
        const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/servicios");
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

    await fetch(`https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/servicios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicio_id: servicioId,
        cantidad
      })
    });

    await cargarDetalle();
    setCantidad(1);
    setServicioId("");
  };

  const guardarSenia = async (valor) => {
    await fetch(`https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/senia`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senia: valor })
    });

    await cargarDetalle();
  };

// 🗑️ ELIMINAR SERVICIO (NUEVO)
  const eliminarServicio = async (ordenServicioId) => {
    if (!window.confirm("¿Eliminar este servicio?")) return;

    await fetch(
      `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/servicios/${ordenServicioId}`,
      { method: "DELETE" }
    );

    await cargarDetalle();
  };

  // ✅ NUEVO
const confirmarOrden = async () => {
  const res = await fetch(
    `https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/confirmar`,
    { method: "POST" }
  );

  if (res.ok) {

    // 👉 abrir ticket 2 veces
    const url = `https://lavadero-backend-production-e1eb.up.railway.app/pdf/ordenes/orden_${id}.pdf`;

    window.open(url, "_blank");
    setTimeout(() => {
      window.open(url, "_blank");
    }, 500);

    alert("Orden confirmada y ticket generado");

    await cargarDetalle();
  } else {
    const data = await res.json();
    alert(data.error || "Error al confirmar orden");
  }
};

  const calcularTotalEstimado = () => {
    if (!orden?.servicios) return 0;

    let total = 0;
    let acolchados = [];

    orden.servicios.forEach(s => {
      const precio = Number(s.precio_unitario);
      const cant = Number(s.cantidad);

      if (s.nombre.toLowerCase().includes("acolchado")) {
        for (let i = 0; i < cant; i++) {
          acolchados.push(precio);
        }
      } else {
        total += cant * precio;
      }
    });

    acolchados.sort((a, b) => b - a);

    acolchados.forEach((precio, index) => {
      if ((index + 1) % 3 !== 0) {
        total += precio;
      }
    });

    return total;
  };

  if (loading) return <p className="p-6">Cargando orden...</p>;
  if (!orden) return <p className="p-6">Orden no encontrada</p>;

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">
        Orden #{orden.orden_id}
      </h2>

      {/* DATOS ORDEN */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <p><b>Cliente:</b> {orden.cliente}</p>
        <p><b>Creada por:</b> {orden.usuario}</p>
        <p><b>Estado:</b> {orden.estado}</p>
        <p>
  <b>Ingreso:</b>{" "}
  {formatearFechaHoraISO(orden.fecha_ingreso)}
</p>

        <div className="mt-3 flex items-center gap-3">
          <b>Seña:</b>
          <input
            type="number"
            className="border rounded px-3 py-1 w-32"
            value={senia}
            onChange={(e) => setSenia(Number(e.target.value))}
            onBlur={() => guardarSenia(senia)}
          />
        </div>

        <p className="mt-2">
          <b>Total estimado:</b> $
          {Math.max(calcularTotalEstimado() - senia, 0)}
        </p>

        <p className="text-sm text-gray-500">
          * El total final se confirma al cerrar la orden
        </p>

        {/* ✅ BOTÓN NUEVO */}
        {orden.estado === "ingresado" && (
          <button
            onClick={confirmarOrden}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirmar Orden
          </button>
        )}
      </div>

      {/* AGREGAR SERVICIO */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="font-semibold mb-3">Agregar servicio</h3>

        <div className="flex gap-3">
          <select
            className="border rounded px-3 py-2 flex-1"
            value={servicioId}
            onChange={(e) => setServicioId(e.target.value)}
          >
            <option value="">Seleccionar servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} (${s.precio})
              </option>
            ))}
          </select>

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
                <td className="px-4 py-2 text-center"><button onClick={() => eliminarServicio(s.orden_servicio_id)} className="text-red-600 hover:underline"> Eliminar </button> </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}