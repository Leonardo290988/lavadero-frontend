import { useEffect, useState } from "react";

const formatearSoloFecha = (f) => {
  return new Date(f).toLocaleDateString("es-AR", {hour12: false});
};

const formatearFechaHora = (f) => {
  return new Date(f).toLocaleString("es-AR");
};

export default function Resumenes() {

  const [tipo, setTipo] = useState("diario");
  const [datos, setDatos] = useState([]);

  const cargarResumen = async () => {
    const res = await fetch(
      `https://lavadero-backend-production-e1eb.up.railway.app/caja/resumenes/${tipo}s`
    );
    const data = await res.json();
    setDatos(data);
  };

  useEffect(() => {
    cargarResumen();
  }, [tipo]);

  const formato = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    });

  const total = (campo) =>
    datos.reduce((acc, d) => acc + Number(d[campo] || 0), 0);

  return (
    <div style={{ padding: 30 }}>

      <h2 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        📊 Resúmenes
      </h2>

      {/* BOTON PDF */}
      <button
        onClick={() =>
          window.open(
            `https://lavadero-backend-production-e1eb.up.railway.app/caja/pdf/${tipo}/resumen_${tipo}.pdf`,
            "_blank"
          )
        }
        style={{
          padding: "10px 18px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 15,
          marginBottom: 15,
          marginRight: 15
        }}
      >
        🖨 Imprimir PDF
      </button>

      {/* Selector */}
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        style={{
          padding: 10,
          fontSize: 16,
          marginBottom: 20,
          borderRadius: 6
        }}
      >
        <option value="diario">Diario</option>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
      </select>

      {/* Tabla */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}
      >

        <thead>
          <tr style={{ background: "#1f2937", color: "white" }}>
            <th style={th}>Desde</th>
            <th style={th}>Hasta</th>
            <th style={th}>Fecha / Hora</th>
            <th style={th}>Efectivo</th>
            <th style={th}>Digital</th>
            <th style={th}>Gastos</th>
            <th style={th}>Guardado</th>
            <th style={th}>Ventas</th>
            <th style={th}>Caja Final</th>
          </tr>
        </thead>

        <tbody>
          {datos.map((r) => (
            <tr key={r.id} style={fila}>
              <td>{r.fecha_desde ? formatearSoloFecha(r.fecha_desde) : ""}</td>
              <td>{r.fecha_hasta ? formatearSoloFecha(r.fecha_hasta) : ""}</td>
              <td>{r.creado_en ? formatearFechaHora(r.creado_en) : ""}</td>
              <td>{formato(r.ingresos_efectivo)}</td>
              <td>{formato(r.ingresos_digital)}</td>
              <td style={{ color: "red" }}>
                {formato(r.gastos)}
              </td>
              <td style={{ color: "blue" }}>
                {formato(r.guardado)}
              </td>
              <td style={{ fontWeight: "bold" }}>
                {formato(r.total_ventas)}
              </td>
              <td style={{ fontWeight: "bold" }}>
                {formato(r.caja_final)}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totales */}
        <tfoot>
          <tr style={{ background: "#f3f4f6", fontWeight: "bold" }}>
            <td colSpan="3">TOTALES</td>
            <td>{formato(total("ingresos_efectivo"))}</td>
            <td>{formato(total("ingresos_digital"))}</td>
            <td>{formato(total("gastos"))}</td>
            <td>{formato(total("guardado"))}</td>
            <td>{formato(total("total_ventas"))}</td>
            <td>{formato(total("caja_final"))}</td>
          </tr>
        </tfoot>

      </table>

    </div>
  );
}

const th = {
  padding: 12,
  textAlign: "left"
};

const fila = {
  borderBottom: "1px solid #ddd",
  cursor: "default"
};