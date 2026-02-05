import { useEffect, useState } from "react";

export default function SolicitarRetiroCliente({ ordenId, clienteId }) {

  const [zona, setZona] = useState("");
  const [direccion, setDireccion] = useState("");
  const [precio, setPrecio] = useState(null);

  // -------------------
  // Obtener precio
  // -------------------
  const cargarPrecio = async (z) => {
    const res = await fetch(
      `https://lavadero-backend-production.up.railway.app/retiros/precio/${z}`
    );
    const data = await res.json();
    setPrecio(data.precio);
  };

  // -------------------
  // Cuando cambia zona
  // -------------------
  const cambiarZona = (z) => {
    setZona(z);
    cargarPrecio(z);
  };

  // -------------------
  // Confirmar retiro
  // -------------------
  const confirmar = async () => {

    if (!zona || !direccion) {
      alert("Complete todos los datos");
      return;
    }

    const res = await fetch(
      "https://lavadero-backend-production.up.railway.app/retiros",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          orden_id: ordenId,
          zona,
          direccion
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error");
      return;
    }

    alert("Solicitud enviada correctamente");
  };

  // -------------------

  return (
    <div className="p-4 max-w-md bg-white rounded shadow">

      <h3 className="text-lg font-bold mb-4">
        Solicitar retiro a domicilio
      </h3>

      <select
        className="input w-full mb-3"
        value={zona}
        onChange={e => cambiarZona(e.target.value)}
      >
        <option value="">Seleccionar zona</option>
        <option value="1">Zona 1</option>
        <option value="2">Zona 2</option>
        <option value="3">Zona 3</option>
      </select>

      <input
        className="input w-full mb-3"
        placeholder="Dirección"
        value={direccion}
        onChange={e => setDireccion(e.target.value)}
      />

      {precio !== null && (
        <p className="mb-3 font-semibold">
          Precio del retiro: ${precio}
        </p>
      )}

      <button
        onClick={confirmar}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        Confirmar solicitud
      </button>

    </div>
  );
}