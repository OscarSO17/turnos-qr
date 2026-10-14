import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Estado = "cargando" | "conectado" | "error";

const textos: Record<Estado, string> = {
  cargando: "comprobando...",
  conectado: "conectado",
  error: "sin conexión",
};

const colores: Record<Estado, string> = {
  cargando: "text-slate-500",
  conectado: "text-green-600",
  error: "text-red-600",
};

function App() {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    fetch(`${API_URL}/salud`)
      .then((respuesta) => setEstado(respuesta.ok ? "conectado" : "error"))
      .catch(() => setEstado("error"));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-slate-800">Turnos QR</h1>
        <p className="mt-2 text-slate-500">Sin filas desordenadas.</p>
        <p className="mt-6 text-sm text-slate-600">
          Servidor:{" "}
          <strong className={colores[estado]}>{textos[estado]}</strong>
        </p>
      </div>
    </main>
  );
}

export default App;