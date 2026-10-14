import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pantalla from "../componentes/Pantalla";
import { obtenerNegocio, tomarTurno, type Negocio } from "../api";

export default function TomarTurno() {
  const { slug = "" } = useParams();
  const navegar = useNavigate();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerNegocio(slug)
      .then(setNegocio)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  async function manejarClic() {
    setEnviando(true);
    setError("");
    try {
      const turno = await tomarTurno(slug, nombre.trim());
      navegar(`/turno/${turno.codigo}`);
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  if (!negocio) {
    return (
      <Pantalla>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-slate-500">Cargando...</p>
        )}
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <h1 className="text-2xl font-bold text-slate-800">{negocio.nombre}</h1>
      <p className="mt-2 text-slate-500">Toma tu turno desde el celular.</p>

      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Tu nombre (opcional)"
        maxLength={60}
        className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
      />

      <button
        onClick={manejarClic}
        disabled={enviando}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {enviando ? "Tomando turno..." : "Tomar turno"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Pantalla>
  );
}