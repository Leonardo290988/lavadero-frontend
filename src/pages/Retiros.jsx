import { useEffect, useState } from "react";
import axios from "axios";
import "./Retiros.css";

function Retiros() {

  const [retiros, setRetiros] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const cargarRetiros = async () => {
    try {
      const res = await axios.get("https://lavadero-backend-production-e1eb.up.railway.app/ordenes/retiradas", {
        params: { q: busqueda }
      });
      setRetiros(res.data);
    } catch (error) {
      console.error(error);
      alert("Error cargando retiros");
    }
  };

  const abrirDetalle = async (id) => {
    const res = await axios.get(
     ` https://lavadero-backend-production-e1eb.up.railway.app/ordenes/${id}/servicios`
    );

    setDetalle(res.data);
    setOrdenSeleccionada(id);
  };

  useEffect(() => {
    cargarRetiros();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      cargarRetiros();
    }, 300);

    return () => clearTimeout(delay);
  }, [busqueda]);

  return (
    <div style={{ padding: 20 }}>

      <h2>Órdenes retiradas</h2>

      <input
        className="buscador"
        placeholder="Buscar por cliente, teléfono u orden..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <table className="tabla-retiros">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Total</th>
            <th>Fecha retiro</th>
            <th>Entregado por</th> {/* ✅ AGREGADO */}
          </tr>
        </thead>

        <tbody>
          {retiros.map((r) => (
            <tr key={r.id} onClick={() => abrirDetalle(r.id)}>
              <td>{r.id}</td>
              <td>{r.cliente}</td>
              <td>{r.telefono}</td>
              <td className="total">${r.total}</td>
              <td>{new Date(r.fecha_retiro).toLocaleString("es-AR", { hour12: false })}</td>
              <td>{r.usuario}</td> {/* ✅ AGREGADO */}
            </tr>
          ))}
        </tbody>
      </table>

      {retiros.length === 0 && (
        <p>No se encontraron retiros</p>
      )}

      {ordenSeleccionada && (
        <div className="modal">
          <div className="modal-contenido">

            <h3>Orden #{ordenSeleccionada}</h3>

            {detalle.map((s, i) => (
              <div key={i}>
                {s.nombre} x{s.cantidad} - ${s.precio}
              </div>
            ))}

            <button onClick={() => setOrdenSeleccionada(null)}>
              Cerrar
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Retiros;