const API_URL = 'https://lavadero-backend-production-e1eb.up.railway.app';

export const buscarClientes = async (query) => {
  const res = await fetch(`${API_URL}/clientes/search?q=${query}`);
  if (!res.ok) throw new Error('Error al buscar clientes');
  return res.json();
};

export const crearCliente = async (data) => {
  const res = await fetch(`
    ${API_URL}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Error al crear cliente');
  return res.json();
};