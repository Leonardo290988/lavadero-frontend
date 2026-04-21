import { useEffect, useState } from "react";

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function ClientesInactivos() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch(`${API}/clientes/inactivos`)
      .then(r => r.json())
      .then(data => setClientes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const estaContactadoReciente = (ultimo_contacto) => {
    if (!ultimo_contacto) return false;
    const dias = Math.floor((new Date() - new Date(ultimo_contacto)) / (1000 * 60 * 60 * 24));
    return dias < 30;
  };

  const diasRestantes = (ultimo_contacto) => {
    if (!ultimo_contacto) return 0;
    const dias = Math.floor((new Date() - new Date(ultimo_contacto)) / (1000 * 60 * 60 * 24));
    return 30 - dias;
  };

  const abrirWhatsApp = async (cliente) => {
    const tel = cliente.telefono.replace(/\D/g, "");
    const mensaje = `🧺 *Lavaderos Moreno*

Hola ${cliente.nombre}! 👋
Te escribimos para contarte que tenemos promociones esperándote 🎉

Lavamos ropa, acolchados, edredones y más ✨
Pasate cuando quieras por *Hipólito Yrigoyen 1471, Moreno*
📅 Lunes a Sábados de 9 a 18hs

¡Te esperamos! 🧺`;

    try {
      const res = await fetch(`${API}/whatsapp/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: tel, mensaje })
      });
      const data = await res.json();

      if (data.automatico) {
        alert("✅ Mensaje enviado automáticamente");
      } else {
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
      }
    } catch {
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
    }

    // Marcar como contactado en el backend
    try {
      await fetch(`${API}/clientes/contactado/${cliente.id}`, { method: "POST" });
      // Actualizar estado local
      setClientes(prev => prev.map(c =>
        c.id === cliente.id
          ? { ...c, ultimo_contacto: new Date().toISOString() }
          : c
      ));
    } catch {
      console.error("Error marcando contacto");
    }
  };

  const diasInactivo = (fecha) => {
    if (!fecha) return "Nunca vino";
    const dias = Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
    return `Hace ${dias} días`;
  };

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">📵 Clientes inactivos</h2>
      <p className="text-gray-500 text-sm mb-6">
        Clientes sin órdenes en los últimos 45 días — {clientes.length} encontrados
      </p>

      <input
        type="text"
        placeholder="Buscar por nombre o teléfono..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="border rounded px-4 py-2 w-full max-w-sm mb-6"
      />

      {filtrados.length === 0 ? (
        <p className="text-gray-500">No hay clientes inactivos.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-center">Última orden</th>
                <th className="px-4 py-3 text-center">Órdenes totales</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c, i) => {
                const contactado = estaContactadoReciente(c.ultimo_contacto);
                const faltan = diasRestantes(c.ultimo_contacto);
                return (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{c.telefono}</td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {diasInactivo(c.ultima_orden)}
                    </td>
                    <td className="px-4 py-3 text-center">{c.total_ordenes}</td>
                    <td className="px-4 py-3 text-center">
                      {contactado ? (
                        <span className="text-xs text-gray-400">
                          Contactado — disponible en {faltan} días
                        </span>
                      ) : (
                        <button
                          onClick={() => abrirWhatsApp(c)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          💬 WhatsApp
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
