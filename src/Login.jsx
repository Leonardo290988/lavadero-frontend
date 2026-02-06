import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "https://lavadero-backend-production-e1eb.up.railway.app/usuarios/login",
        { usuario, password }
      );

      // ✅ GUARDAR USUARIO LOGUEADO
      localStorage.setItem("usuario", JSON.stringify(res.data));

      // ✅ SEGUIR FLUJO NORMAL
      onLogin(res.data);

    } catch {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="logo">LM</div>

        <h1>LAVADEROS MORENO</h1>
        <p>Sistema de Gestión</p>

        {error && <span className="error">{error}</span>}

        <input
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Ingresar
        </button>

      </div>
    </div>
  );
}

export default Login;