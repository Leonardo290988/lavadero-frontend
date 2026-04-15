import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import { buscarClientes, crearCliente } from '../services/clientesService';
import { crearOrden } from '../services/ordenesService';

const API = "https://lavadero-backend-production-e1eb.up.railway.app";

export default function NuevaOrden() {
  const navigate = useNavigate();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [senia, setSenia] = useState(0);

  // Puntos del cliente
  const [puntos, setPuntos] = useState(null);
  const [descuentoAplicado, setDescuentoAplicado] = useState(null); // { porcentaje, puntos_usados }
  const [cargandoPuntos, setCargandoPuntos] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', telefono: '', direccion: ''
  });

  const cargarClientes = async (inputValue) => {
    if (!inputValue || inputValue.length < 1) {
      setMostrarAlta(false);
      return [];
    }

    const data = await buscarClientes(inputValue);

    if (data.length === 0) {
      setMostrarAlta(true);
      return [];
    }

    setMostrarAlta(false);
    return data.map(c => ({
      value: c.id,
      label: `${c.id} - ${c.nombre} (${c.telefono})`,
      cliente: c
    }));
  };

  const seleccionarCliente = async (opt) => {
    if (!opt) {
      setClienteSeleccionado(null);
      setPuntos(null);
      setDescuentoAplicado(null);
      return;
    }

    setClienteSeleccionado(opt.cliente);
    setMostrarAlta(false);
    setDescuentoAplicado(null);

    // Cargar puntos del cliente
    setCargandoPuntos(true);
    try {
      const res = await fetch(`${API}/puntos/cliente/${opt.cliente.id}`);
      const data = await res.json();
      setPuntos(data);
    } catch {
      setPuntos(null);
    } finally {
      setCargandoPuntos(false);
    }
  };

  const canjearDescuento = async () => {
    if (!clienteSeleccionado || !puntos?.descuento_disponible) return;

    const confirmado = window.confirm(
      `¿El cliente quiere canjear ${puntos.descuento_disponible.puntos} puntos por un ${puntos.descuento_disponible.porcentaje}% de descuento en esta orden?`
    );
    if (!confirmado) return;

    try {
      const res = await fetch(`${API}/puntos/canjear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: clienteSeleccionado.id })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al canjear");
        return;
      }

      setDescuentoAplicado(data);
      // Actualizar puntos mostrados
      const res2 = await fetch(`${API}/puntos/cliente/${clienteSeleccionado.id}`);
      setPuntos(await res2.json());

      alert(`✅ Descuento del ${data.porcentaje}% aplicado a esta orden`);
    } catch {
      alert("Error de conexión");
    }
  };

  const crearOrdenConCliente = async (cliente_id) => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    try {
      const orden = await crearOrden(
        cliente_id,
        senia,
        usuario.id,
        descuentoAplicado?.porcentaje || 0
      );
      navigate(`/ordenes/${orden.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const registrarYCrearOrden = async () => {
    const cliente = await crearCliente(nuevoCliente);
    await crearOrdenConCliente(cliente.id);
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">Nueva orden</h2>

      <label className="block mb-2 font-semibold">Buscar cliente</label>

      <AsyncSelect
        cacheOptions
        defaultOptions={false}
        loadOptions={cargarClientes}
        onChange={seleccionarCliente}
        placeholder="Nombre, teléfono o número de cliente"
        noOptionsMessage={() => "No se encontraron clientes"}
      />

      {/* CLIENTE ENCONTRADO */}
      {clienteSeleccionado && (
        <div className="bg-white p-4 rounded shadow mb-4 mt-4">
          <p><b>Nombre:</b> {clienteSeleccionado.nombre}</p>
          <p><b>Teléfono:</b> {clienteSeleccionado.telefono}</p>
          <p><b>Dirección:</b> {clienteSeleccionado.direccion}</p>

          {/* PUNTOS DEL CLIENTE */}
          {cargandoPuntos && (
            <p className="mt-3 text-sm text-gray-500">Cargando puntos...</p>
          )}

          {puntos && !cargandoPuntos && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-800">
                🏆 Puntos acumulados: {puntos.puntos_acumulados}
              </p>

              {puntos.descuento_disponible && !descuentoAplicado && (
                <div className="mt-2">
                  <p className="text-green-700 font-semibold text-sm">
                    ✅ Tiene descuento disponible: {puntos.descuento_disponible.porcentaje}% off
                  </p>
                  <button
                    onClick={canjearDescuento}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Canjear {puntos.descuento_disponible.porcentaje}% de descuento
                  </button>
                </div>
              )}

              {descuentoAplicado && (
                <p className="mt-2 text-green-700 font-bold text-sm">
                  🎉 Descuento del {descuentoAplicado.porcentaje}% aplicado a esta orden
                </p>
              )}

              {!puntos.descuento_disponible && puntos.proximo_nivel && (
                <p className="text-amber-700 text-sm mt-1">
                  Le faltan {puntos.proximo_nivel.faltan} puntos para {puntos.proximo_nivel.porcentaje}% de descuento
                </p>
              )}
            </div>
          )}

          {/* SEÑA */}
          <label className="block mt-4 font-semibold">Seña</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full mt-1"
            value={senia}
            onChange={(e) => setSenia(Number(e.target.value))}
            placeholder="0"
          />

          {descuentoAplicado && (
            <p className="mt-2 text-sm text-green-700 font-semibold">
              ✅ Se aplicará {descuentoAplicado.porcentaje}% de descuento al cerrar la orden
            </p>
          )}

          <button
            onClick={() => crearOrdenConCliente(clienteSeleccionado.id)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear orden
          </button>
        </div>
      )}

      {/* CLIENTE NO ENCONTRADO */}
      {mostrarAlta && !clienteSeleccionado && (
        <div className="bg-white p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Registrar cliente</h3>

          <input
            placeholder="Nombre"
            className="border rounded px-3 py-2 w-full mb-2"
            value={nuevoCliente.nombre}
            onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
          />
          <input
            placeholder="Teléfono"
            className="border rounded px-3 py-2 w-full mb-2"
            value={nuevoCliente.telefono}
            onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
          />
          <input
            placeholder="Dirección"
            className="border rounded px-3 py-2 w-full mb-2"
            value={nuevoCliente.direccion}
            onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
          />

          <button
            onClick={registrarYCrearOrden}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Registrar cliente y crear orden
          </button>
        </div>
      )}
    </div>
  );
}
