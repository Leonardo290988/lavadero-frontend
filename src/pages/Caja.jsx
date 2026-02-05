import { useEffect, useState } from "react";

export default function Caja() {

  const [caja, setCaja] = useState(null);
  const [resumen, setResumen] = useState(null);

  const [montoInicial, setMontoInicial] = useState("");
  const [turno, setTurno] = useState("mañana");

  // -------------------------
  // CARGAR CAJA ABIERTA
  // -------------------------
  const cargarCaja = async () => {
    try {
      const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/caja/actual");

      if (!res.ok) {
        setCaja(null);

   const r = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/caja/ultimo-cierre");
   const d = await r.json();
  setMontoInicial(d.monto);


        return;
      }

      const data = await res.json();
      setCaja(data);
      cargarResumen(data.id);
    } catch (error) {
      console.error("Error cargar caja:", error);
      setCaja(null);
    }
  };

  useEffect(() => {
    cargarCaja();
  }, []);

  // -------------------------
  // CARGAR RESUMEN
  // -------------------------
  const cargarResumen = async (cajaId) => {
    const res = await fetch(
     ` https://lavadero-backend-production-e1eb.up.railway.app/caja/resumen/turno/${cajaId}`
    );
    const data = await res.json();
    setResumen(data);
  };

  // -------------------------
  // ABRIR CAJA
  // -------------------------
  const abrirCaja = async () => {

    if (montoInicial === "") {
      alert("Ingresá monto inicial");
      return;
    }

    const res = await fetch("https://lavadero-backend-production-e1eb.up.railway.app/caja/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turno,
        inicio_caja: Number(montoInicial)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error al abrir caja");
      return;
    }

    setMontoInicial("");
    cargarCaja();
  };

  // -------------------------
  // GUARDAR DINERO
  // -------------------------
 const guardarDinero = async () => {

  const monto = prompt("Monto a guardar:");
  if (!monto || isNaN(monto)) return;

  await fetch("https://lavadero-backend-production-e1eb.up.railway.app/caja/movimiento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caja_id: caja.id,
      tipo: "guardado",                 // ✅
      descripcion: "Guardado de efectivo",
      monto: Number(monto),
      forma_pago: "Efectivo"
    })
  });

  cargarResumen(caja.id);
};


  // -------------------------
// REGISTRAR GASTO
// -------------------------
const registrarGasto = async () => {

  const monto = prompt("Monto del gasto:");
  if (!monto || isNaN(monto)) return;

  const descripcion = prompt("Descripción del gasto:");
  if (!descripcion) return;

  await fetch("https://lavadero-backend-production-e1eb.up.railway.app/caja/movimiento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caja_id: caja.id,
      tipo: "gasto",          // ✅
      descripcion,
      monto: Number(monto),
      forma_pago: "Efectivo"
    })
  });

  cargarResumen(caja.id);
};

  // -------------------------
  // CERRAR CAJA
  // -------------------------
  const cerrarCaja = async () => {

    if (!window.confirm("¿Cerrar caja?")) return;

    const res = await fetch(
     `https://lavadero-backend-production.up.railway-e1eb.app/caja/cerrar/${caja.id}`,
      { method: "POST" }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error al cerrar caja");
      return;
    }

    setCaja(null);
    setResumen(null);
  };

  // =====================================================
  // RENDER
  // =====================================================

  // -------------------------
  // NO HAY CAJA
  // -------------------------
  if (!caja) {
    return (
      <div className="p-6 max-w-md bg-white rounded shadow">

        <h2 className="text-2xl font-bold mb-4">
          Abrir caja
        </h2>

        <input
          type="number"
          placeholder="Monto inicial"
          className="input w-full mb-3"
          value={montoInicial}
          onChange={e => setMontoInicial(e.target.value)}
        />

        <select
          className="input w-full mb-4"
          value={turno}
          onChange={e => setTurno(e.target.value)}
        >
          <option value="mañana">Mañana</option>
          <option value="tarde">Tarde</option>
        </select>

        <button
          onClick={abrirCaja}
          className="bg-emerald-600 text-white w-full py-2 rounded"
        >
          Abrir caja
        </button>

      </div>
    );
  }

  // -------------------------
  // HAY CAJA ABIERTA
  // -------------------------
  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        Caja turno {caja.turno}
      </h2>

      {!resumen ? (
        <p>Cargando resumen...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

  <Card titulo="Caja actual">
    ${resumen.efectivo_final}
  </Card>

  <Card titulo="Ingresos efectivo">
    ${resumen.ingresos_efectivo}
  </Card>

  <Card titulo="Transferencias / MP">
    ${resumen.transferencias}
  </Card>

  <Card titulo="Gastos">
    ${resumen.gastos}
  </Card>

  <Card titulo="Guardado">
    ${resumen.guardado}
  </Card>

  <Card titulo="Total ingresos">
    ${resumen.total_ventas}
  </Card>

</div>
      )}

      <div className="mt-8 flex gap-4">

        <button
          onClick={guardarDinero}
          className="bg-yellow-500 text-white px-6 py-2 rounded"
        >
          Guardar dinero
        </button>


<button
  onClick={registrarGasto}
  className="bg-orange-500 text-white px-6 py-2 rounded"
>
  Registrar gasto
</button>


        <button
          onClick={cerrarCaja}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Cerrar caja
        </button>

      </div>

    </div>
  );
}

// --------------------------------
function Card({ titulo, children }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-gray-500">{titulo}</p>
      <p className="text-2xl font-bold">{children}</p>
    </div>
  );
}