import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NuevaOrden from "./pages/NuevaOrden";
import Ordenes from "./pages/Ordenes";
import DetalleOrden from "./pages/DetalleOrden";
import OrdenesListas from "./pages/OrdenesListas";
import Caja from "./pages/Caja";   // 👈 IMPORT CORRECTO
import Retiros from "./pages/Retiros";
import Resumenes from "./pages/Resumenes";
import SolicitudesRetiros from "./pages/SolicitudesRetiros";
import Envios from "./pages/Envios";
import SimuladorCliente from "./pages/SimuladorCliente";
import EnviosEntregados from "./pages/EnviosEntregados";
import EnviosPendientesRepartidor from "./pages/repartidor/EnviosPendientes";




function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/envios-entregados" element={<EnviosEntregados />} />

        <Route path="retiros" element={<Retiros />} />
        <Route path="resumenes" element={<Resumenes />} />
        <Route path="solicitudes-retiro" element={<SolicitudesRetiros />} />
        <Route path="/repartidor" element={<EnviosPendientesRepartidor />}/>
       

        <Route path="ordenes">
          <Route index element={<Ordenes />} />
          <Route path="nueva" element={<NuevaOrden />} />
          <Route path=":id" element={<DetalleOrden />} />
        </Route>
        <Route path="/envios" element={<Envios />} />
        <Route path="ordenes-listas" element={<OrdenesListas />} />
        <Route path="caja" element={<Caja />} />
        <Route path="/simulador-cliente" element={<SimuladorCliente />} />

      </Route>
    </Routes>
  );
}

export default App;