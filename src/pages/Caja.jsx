import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function Caja() {

  const [caja, setCaja] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [montoInicial, setMontoInicial] = useState("");
  const [turno, setTurno] = useState("mañana");
  const [cerrando, setCerrando] = useState(false);
  const [ultimoCierre, setUltimoCierre] = useState(null); // { cajaId, pdf } del último turno cerrado
  const [reimprimiendo, setReimprimiendo] = useState(false);

  // -------------------------
  // CARGAR CAJA ABIERTA
  // -------------------------
  const cargarCaja = async () => {
    try {
      const res = await fetch(`${API}/caja/actual`);

      if (!res.ok) {
        setCaja(null);
        const r = await fetch(`${API}/caja/ultimo-cierre`);
        const d = await r.json();
        setMontoInicial(d?.monto || "");
        return;
      }

      const data = await res.json();

      if (data.error) {
        setCaja(null);
        const r = await fetch(`${API}/caja/ultimo-cierre`);
        const d = await r.json();
        setMontoInicial(d?.monto || "");
        return;
      }

      setCaja(data);
      cargarResumenTurno(data.id);

    } catch (error) {
      console.error("Error cargar caja:", error);
      setCaja(null);
    }
  };

  useEffect(() => {
    cargarCaja();
  }, []);

  // -------------------------
  // CARGAR RESUMEN DEL TURNO
  // -------------------------
  const cargarResumenTurno = async (cajaId) => {
    try {
      const res = await fetch(`${API}/caja/resumen/turno/${cajaId}`);
      const data = await res.json();
      setResumen(data);
    } catch (err) {
      console.error("Error resumen turno:", err);
    }
  };

  // -------------------------
  // ABRIR CAJA
  // -------------------------
  const abrirCaja = async () => {
    if (montoInicial === "") {
      alert("Ingresá monto inicial");
      return;
    }

    const res = await fetch(`${API}/caja/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turno, inicio_caja: Number(montoInicial) }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error al abrir caja");
      return;
    }

    setMontoInicial("");
    setUltimoCierre(null);
    cargarCaja();
  };

  // -------------------------
  // GUARDAR DINERO
  // -------------------------
  const guardarDinero = async () => {
    const monto = prompt("Monto a guardar:");
    if (!monto || isNaN(monto)) return;

    await fetch(`${API}/caja/movimiento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caja_id: caja.id,
        tipo: "guardado",
        descripcion: "Guardado de efectivo",
        monto: Number(monto),
        forma_pago: "Efectivo",
      }),
    });

    cargarResumenTurno(caja.id);
  };

  // -------------------------
  // REGISTRAR GASTO
  // -------------------------
  const registrarGasto = async () => {
    const monto = prompt("Monto del gasto:");
    if (!monto || isNaN(monto)) return;

    const descripcion = prompt("Descripción del gasto:");
    if (!descripcion) return;

    await fetch(`${API}/caja/movimiento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caja_id: caja.id,
        tipo: "gasto",
        descripcion,
        monto: Number(monto),
        forma_pago: "Efectivo",
      }),
    });

    cargarResumenTurno(caja.id);
  };

  // -------------------------
  // CERRAR CAJA
  // -------------------------
  const cerrarCaja = async () => {
    if (!window.confirm("¿Cerrar caja?")) return;

    setCerrando(true);

    try {
      const res = await fetch(`${API}/caja/cerrar/${caja.id}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al cerrar caja");
        return;
      }

      // Guardar referencia al cierre para poder reimprimir
      if (data.pdf) {
        setUltimoCierre({ pdf: data.pdf });
        // Abrir ticket automáticamente
        window.open(`${API}${data.pdf}`, "_blank");
      } else {
        alert("Caja cerrada, pero no se generó el PDF");
      }

      setCaja(null);
      setResumen(null);

      // Cargar monto del cierre como sugerencia para próxima apertura
      const r = await fetch(`${API}/caja/ultimo-cierre`);
      const d = await r.json();
      setMontoInicial(d?.monto || "");

    } catch (error) {
      console.error("Error cerrando caja:", error);
      alert("Error de conexión al cerrar caja");
    } finally {
      setCerrando(false);
    }
  };

  // -------------------------
  // REIMPRIMIR ÚLTIMO CIERRE
  // -------------------------
  const reimprimirUltimoCierre = async () => {
    if (!ultimoCierre?.pdf) return;
    setReimprimiendo(true);
    try {
      window.open(`${API}${ultimoCierre.pdf}?t=${Date.now()}`, "_blank");
    } finally {
      setReimprimiendo(false);
    }
  };

  // =====================================================
  // RENDER — NO HAY CAJA
  // =====================================================
  if (!caja) {
    return (
      <div className="p-6 max-w-md">

        <div className="bg-white rounded shadow p-6 mb-4">
          <h2 className="text-2xl font-bold mb-4">Abrir caja</h2>

          <input
            type="number"
            placeholder="Monto inicial"
            className="border rounded px-3 py-2 w-full mb-3"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 w-full mb-4"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
          </select>

          <button
            onClick={abrirCaja}
            className="bg-emerald-600 text-white w-full py-2 rounded hover:bg-emerald-700"
          >
            Abrir caja
          </button>
        </div>

        {/* Botón reimprimir si hay un cierre reciente en esta sesión */}
        {ultimoCierre?.pdf && (
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-gray-500 mb-2">Último cierre de esta sesión:</p>
            <button
              onClick={reimprimirUltimoCierre}
              disabled={reimprimiendo}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              🖨️ Reimprimir ticket de cierre
            </button>
          </div>
        )}

      </div>
    );
  }

  // =====================================================
  // RENDER — HAY CAJA ABIERTA
  // =====================================================
  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        Caja turno {caja.turno}
      </h2>

      {!resumen ? (
        <p>Cargando resumen...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card titulo="Caja actual">${resumen.efectivo_final}</Card>
          <Card titulo="Ingresos efectivo">${resumen.ingresos_efectivo}</Card>
          <Card titulo="Transferencias / MP">${resumen.transferencias}</Card>
          <Card titulo="Gastos">${resumen.gastos}</Card>
          <Card titulo="Guardado">${resumen.guardado}</Card>
          <Card titulo="Total ingresos">${resumen.total_ventas}</Card>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4">

        <button
          onClick={guardarDinero}
          className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
        >
          Guardar dinero
        </button>

        <button
          onClick={registrarGasto}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
        >
          Registrar gasto
        </button>

        <button
          onClick={cerrarCaja}
          disabled={cerrando}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
        >
          {cerrando ? (
            <>
              <span className="animate-spin">⏳</span> Cerrando...
            </>
          ) : (
            "Cerrar caja"
          )}
        </button>

      </div>

    </div>
  );
}

// --------------------------------
function Card({ titulo, children }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-gray-500 text-sm">{titulo}</p>
      <p className="text-2xl font-bold">{children}</p>
    </div>
  );
}
