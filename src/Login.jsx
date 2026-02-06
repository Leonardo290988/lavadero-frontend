import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ingresar = async () => {
    try {
      const res = await axios.post(
        "https://lavadero-backend-production-e1eb.up.railway.app/usuarios/login",
        { usuario, password }
      );

      onLogin(res.data);
    } catch {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "100px auto" }}>
      <h2>Ingresar</h2>

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

      <button onClick={ingresar}>Entrar</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;