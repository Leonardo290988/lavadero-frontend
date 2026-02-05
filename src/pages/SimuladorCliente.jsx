import { useState } from "react";

export default function SimuladorCliente() {
  const [clienteId, setClienteId] = useState(1);
  const [direccion, setDireccion] = useState("Av Siempre Viva 742");
  const [zona, setZona] = useState(1);
  const [quiereEnvio, setQuiereEnvio] = useState(true);
  const [loading, setLoading] = useState(false);

  const solicitarCombo = async () => {
    try {
      setLoading(true);

      // 1) Crear retiro prepago
      const retiroRes = await fetch("http://localhost:3000/retiros/prepago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          zona,
          direccion,
          tipo: quiereEnvio ? "combo" : "retiro"
        })
      });

      const retiro = await retiroRes.json();

      let envio = null;

      // 2) Crear envio prepago (opcional)
      if (quiereEnvio) {
        const envioRes = await fetch("http://localhost:3000/envios/prepago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cliente_id: clienteId,
            zona,
            direccion,
            tipo: "combo"
          })
        });

        envio = await envioRes.json();
      }

      // ✅ CORRECCIÓN
      const total =
        Number(retiro.precio) +
        Number(envio?.precio || 0);

      // 4) Crear link MP
      const prefRes = await fetch("http://localhost:3000/pagos/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: quiereEnvio ? "Retiro + Envío" : "Retiro a domicilio",
          precio: total,
          tipo: quiereEnvio ? "combo" : "retiro",
          retiro_id: retiro.id,
          envio_id: envio?.id || null
        })
      });

      const pref = await prefRes.json();

      window.open(pref.link, "_blank");

    } catch (err) {
      console.error(err);
      alert("Error simulando solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-96">
        <h2 className="text-xl font-bold mb-4">Simulador Cliente</h2>

        <label className="block mb-2">Cliente ID</label>
        <input
          type="number"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="border w-full mb-3 p-2"
        />

        <label className="block mb-2">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="border w-full mb-3 p-2"
        />

        <label className="block mb-2">Zona</label>
        <select
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className="border w-full mb-3 p-2"
        >
          <option value={1}>Zona 1</option>
          <option value={2}>Zona 2</option>
          <option value={3}>Zona 3</option>
        </select>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={quiereEnvio}
            onChange={(e) => setQuiereEnvio(e.target.checked)}
          />
          Incluir envío
        </label>

        <button
          disabled={loading}
          onClick={solicitarCombo}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Procesando..." : "Solicitar servicio"}
        </button>
      </div>
    </div>
  );
}