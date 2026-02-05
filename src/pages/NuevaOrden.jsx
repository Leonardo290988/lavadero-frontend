import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import { buscarClientes, crearCliente } from '../services/clientesService';
import { crearOrden } from '../services/ordenesService';

export default function NuevaOrden() {
  const navigate = useNavigate();

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);

  const [senia, setSenia] = useState(0);   // ✅ NUEVO

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });

const cargarClientes = async (inputValue) => {
  console.log("BUSCANDO:", inputValue);

  if (!inputValue || inputValue.length < 1) {
    setMostrarAlta(false);
    return [];
  }

  const data = await buscarClientes(inputValue);
  console.log("RESULTADO:", data);

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

 const crearOrdenConCliente = async (cliente_id) => {
  try {
    const orden = await crearOrden(cliente_id, senia);
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
  onChange={(opt) => {
    if (opt) {
      setClienteSeleccionado(opt.cliente);
      setMostrarAlta(false);
    } else {
      setClienteSeleccionado(null);
    }
  }}
  placeholder="Nombre, teléfono o número de cliente"
  noOptionsMessage={() => "No se encontraron clientes"}
/>

      {/* CLIENTE ENCONTRADO */}
      {clienteSeleccionado && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <p><b>Nombre:</b> {clienteSeleccionado.nombre}</p>
          <p><b>Teléfono:</b> {clienteSeleccionado.telefono}</p>
          <p><b>Dirección:</b> {clienteSeleccionado.direccion}</p>

          {/* ✅ NUEVO INPUT SEÑA */}
          <label className="block mt-4 font-semibold">Seña</label>
          <input
            type="number"
            className="input"
            value={senia}
            onChange={(e) => setSenia(Number(e.target.value))}
            placeholder="0"
          />

          <button
            onClick={() => crearOrdenConCliente(clienteSeleccionado.id)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Crear orden
          </button>
        </div>
      )}

      {/* CLIENTE NO ENCONTRADO */}
      {mostrarAlta && !clienteSeleccionado && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Registrar cliente</h3>

          <input
            placeholder="Nombre"
            className="input"
            value={nuevoCliente.nombre}
            onChange={e =>
              setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
            }
          />

          <input
            placeholder="Teléfono"
            className="input"
            value={nuevoCliente.telefono}
            onChange={e =>
              setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
            }
          />

          <input
            placeholder="Dirección"
            className="input"
            value={nuevoCliente.direccion}
            onChange={e =>
              setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })
            }
          />

          <button
            onClick={registrarYCrearOrden}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Registrar cliente y crear orden
          </button>
        </div>
      )}
    </div>
  );
}