import { useEffect, useState } from "react";

const formatearSoloFecha = (f) =>
  new Date(f).toLocaleDateString("es-AR");

const formatearFechaHora = (f) =>
  new Date(f).toLocaleString("es-AR");

export default function Resumenes() {

  const [tipo, setTipo] = useState("diario");
  const [datos, setDatos] = useState([]);

  const [turnos, setTurnos] = useState([]);
  const [turnoId, setTurnoId] = useState("");

  const [seleccionado, setSeleccionado] = useState(null);

  // =========================
  // CARGAR RESUMENES
  // =========================
  const cargarResumen = async () => {

    if (tipo === "turno" && turnoId) {
      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/caja/resumen/turno/${turnoId}`
      );
      const data = await res.json();

      // Le agregamos un id artificial
      setDatos([{ ...data, _turnoId: turnoId }]);
    } else {

      const res = await fetch(
        `https://lavadero-backend-production-e1eb.up.railway.app/caja/resumenes/${tipo}s`
      );
      const data = await res.json();
      setDatos(data);
    }

    setSeleccionado(null);
  };

  // =========================
  // CARGAR TURNOS
  // =========================
  const cargarTurnos = async () => {
    const res = await fetch(
      "https://lavadero-backend-production-e1eb.up.railway.app/caja/turnos"
    );
    const data = await res.json();
    setTurnos(data);
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [tipo, turnoId]);

  // =========================
  // FORMATO
  // =========================
  const formato = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    });

  const total = (campo) =>
    datos.reduce((acc, d) => acc + Number(d[campo] || 0), 0);

  // =========================
  // IMPRIMIR
  // =========================
  const imprimirSeleccionado = async () => {

    if (!seleccionado) {
      alert("Seleccione un resumen");
      return;
    }

    // 👉 TURNO
    if (tipo === "turno") {
      window.open(
        `https://lavadero-backend-production-e1eb.up.railway.app/caja/resumen/turno/${seleccionado}`,
        "_blank"
      );
      return;
    }

    // 👉 DIARIO / SEMANAL / MENSUAL
    const res = await fetch(
      `https://lavadero-backend-production-e1eb.up.railway.app/caja/resumenes/imprimir/${seleccionado}`
    );

    const data = await res.json();

    window.open(
      `https://lavadero-backend-production-e1eb.up.railway.app${data.pdf}`,
      "_blank"
    );
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 30 }}>

      <h2 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        📊 Resúmenes
      </h2>

      <button
        onClick={imprimirSeleccionado}
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

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        style={{ padding: 10, fontSize: 16, marginRight: 10 }}
      >
        <option value="diario">Diario</option>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
        <option value="turno">Por turno</option>
      </select>

      {tipo === "turno" && (
        <select
          value={turnoId}
          onChange={(e) => setTurnoId(e.target.value)}
          style={{ padding: 10 }}
        >
          <option value="">Seleccione turno</option>
          {turnos.map(t => (
            <option key={t.id} value={t.id}>
              {t.fecha} - Turno {t.turno}
            </option>
          ))}
        </select>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          marginTop: 20
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
          {datos.map((r, i) => {

            const idFila = r.id || r._turnoId;

            return (
              <tr
                key={i}
                onClick={() => setSeleccionado(idFila)}
                style={{
                  ...fila,
                  background:
                    seleccionado === idFila
                      ? "#dbeafe"
                      : "white"
                }}
              >
                <td>{r.fecha_desde ? formatearSoloFecha(r.fecha_desde) : ""}</td>
                <td>{r.fecha_hasta ? formatearSoloFecha(r.fecha_hasta) : ""}</td>
                <td>{r.creado_en ? formatearFechaHora(r.creado_en) : ""}</td>
                <td>{formato(r.ingresos_efectivo)}</td>
                <td>{formato(r.ingresos_digital || r.transferencias)}</td>
                <td style={{ color: "red" }}>{formato(r.gastos)}</td>
                <td style={{ color: "blue" }}>{formato(r.guardado)}</td>
                <td style={{ fontWeight: "bold" }}>{formato(r.total_ventas)}</td>
                <td style={{ fontWeight: "bold" }}>{formato(r.caja_final || r.efectivo_final)}</td>
              </tr>
            );
          })}
        </tbody>

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
  cursor: "pointer"
};