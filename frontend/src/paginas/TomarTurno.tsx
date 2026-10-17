import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pantalla from "../componentes/Pantalla";
import Boleto from "../componentes/Boleto";
import {
  ErrorApi,
  obtenerNegocio,
  obtenerTurno,
  tomarTurno,
  type Negocio,
} from "../api";
import { claveTurno } from "../sesion";

export default function TomarTurno() {
  const { slug = "" } = useParams();
  const navegar = useNavigate();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      try {
        const guardado = localStorage.getItem(claveTurno(slug));

        if (guardado) {
          try {
            const turno = await obtenerTurno(guardado);
            if (turno.estado === "esperando" || turno.estado === "atendiendo") {
              if (activo) navegar(`/turno/${guardado}`, { replace: true });
              return;
            }
            // El turno ya terminó o se canceló: lo olvidamos.
            localStorage.removeItem(claveTurno(slug));
          } catch (e) {
            if (e instanceof ErrorApi && e.estado === 404) {
              localStorage.removeItem(claveTurno(slug));
            } else {
              throw e;
            }
          }
        }

        const datos = await obtenerNegocio(slug);
        if (activo) setNegocio(datos);
      } catch (e) {
        if (activo) setError((e as Error).message);
      }
    }

    iniciar();
    return () => {
      activo = false;
    };
  }, [slug, navegar]);

  async function manejarClic() {
    setEnviando(true);
    setError("");
    try {
      const turno = await tomarTurno(slug, nombre.trim());
      localStorage.setItem(claveTurno(slug), turno.codigo);
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
          <p className="text-acento-oscuro">{error}</p>
        ) : (
          <p className="text-tinta-suave">Cargando...</p>
        )}
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Boleto etiqueta="Turnos" titulo={negocio.nombre}>
        <p className="text-sm text-tinta-suave">
          Toma tu turno desde el celular y sigue la fila sin esperar de pie.
        </p>

        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre (opcional)"
          maxLength={60}
          className="mt-5 w-full rounded-md border border-linea bg-papel px-3 py-2.5 text-center placeholder:text-tinta-suave/70 focus:border-acento focus:outline-none"
        />

        <button
          onClick={manejarClic}
          disabled={enviando}
          className="mt-3 w-full rounded-md bg-acento px-4 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-acento-oscuro disabled:opacity-50"
        >
          {enviando ? "Tomando turno..." : "Tomar turno"}
        </button>

        {error && <p className="mt-3 text-sm text-acento-oscuro">{error}</p>}
      </Boleto>
    </Pantalla>
  );
}