import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Boleto from "../componentes/Boleto";
import ModalQR from "../componentes/ModalQR";
import Pantalla from "../componentes/Pantalla";
import {
  ErrorApi,
  llamarSiguiente,
  obtenerFila,
  obtenerNegocio,
  type TurnoFila,
} from "../api";
import { claveToken as clave } from "../sesion";

const claseEtiqueta =
  "font-numero text-[0.7rem] uppercase tracking-[0.3em] text-tinta-suave";

export default function Panel() {
  const { slug = "" } = useParams();
  const [token, setToken] = useState(
    () => localStorage.getItem(clave(slug)) ?? ""
  );
  const [entrada, setEntrada] = useState("");
  const [fila, setFila] = useState<TurnoFila[]>([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [verQR, setVerQR] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState("");

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      setFila(await obtenerFila(slug, token));
      setError("");
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) {
        localStorage.removeItem(clave(slug));
        setToken("");
        setError("Código de administrador incorrecto");
      } else {
        setError((e as Error).message);
      }
    }
  }, [slug, token]);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 5000);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    obtenerNegocio(slug)
      .then((negocio) => setNombreNegocio(negocio.nombre))
      .catch(() => {});
  }, [slug]);

  function entrar() {
    const limpio = entrada.trim();
    if (!limpio) return;
    localStorage.setItem(clave(slug), limpio);
    setToken(limpio);
    setEntrada("");
    setError("");
  }

  function salir() {
    localStorage.removeItem(clave(slug));
    setToken("");
    setFila([]);
  }

  async function siguiente() {
    setOcupado(true);
    try {
      await llamarSiguiente(slug, token);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  if (!token) {
    return (
      <Pantalla>
        <Boleto etiqueta="Panel" titulo="Acceso del negocio">
          <p className="text-sm text-tinta-suave">
            Ingresa tu código de administrador.
          </p>
          <input
            type="password"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            placeholder="Código de administrador"
            className="mt-5 w-full rounded-md border border-linea bg-papel px-3 py-2.5 text-center placeholder:text-tinta-suave/70 focus:border-acento focus:outline-none"
          />
          <button
            onClick={entrar}
            className="mt-3 w-full rounded-md bg-acento px-4 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-acento-oscuro"
          >
            Entrar
          </button>
          {error && <p className="mt-3 text-sm text-acento-oscuro">{error}</p>}
        </Boleto>
      </Pantalla>
    );
  }

  const atendiendo = fila.find((t) => t.estado === "atendiendo");
  const esperando = fila.filter((t) => t.estado === "esperando");

  return (
    <Pantalla ancho>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-linea pb-4 text-left">
        <div>
          <p className={claseEtiqueta}>Panel</p>
          <h1 className="mt-1 font-titulo text-3xl leading-tight">
            {nombreNegocio || slug}
          </h1>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <button
            onClick={() => setVerQR(true)}
            className="underline underline-offset-4 hover:text-acento"
          >
            Ver QR
          </button>
          <button
            onClick={salir}
            className="text-tinta-suave underline underline-offset-4 hover:text-acento"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 text-left md:grid-cols-2">
        <section className="rounded-md border border-linea bg-boleto p-6 text-center">
          <p className={claseEtiqueta}>Atendiendo ahora</p>
          <p className="mt-2 font-numero text-8xl font-medium leading-none">
            {atendiendo ? atendiendo.numero : "—"}
          </p>
          <p className="mt-2 min-h-6 text-sm text-tinta-suave">
            {atendiendo?.nombre_cliente ?? ""}
          </p>

          <button
            onClick={siguiente}
            disabled={ocupado || (!atendiendo && esperando.length === 0)}
            className="mt-4 w-full rounded-md bg-acento px-4 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-acento-oscuro disabled:opacity-40"
          >
            {esperando.length > 0
              ? "Siguiente"
              : atendiendo
                ? "Terminar turno actual"
                : "Sin turnos en espera"}
          </button>
        </section>

        <section>
          <h2 className={claseEtiqueta}>En espera ({esperando.length})</h2>
          {esperando.length === 0 ? (
            <p className="mt-4 text-tinta-suave">No hay nadie esperando.</p>
          ) : (
            <ul className="mt-2">
              {esperando.map((t) => (
                <li
                  key={t.numero}
                  className="flex items-baseline justify-between gap-4 border-b border-linea py-3"
                >
                  <span className="font-numero text-xl">{t.numero}</span>
                  <span className="text-tinta-suave">
                    {t.nombre_cliente ?? "Sin nombre"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {error && <p className="mt-4 text-sm text-acento-oscuro">{error}</p>}

      <ModalQR
        abierto={verQR}
        onCerrar={() => setVerQR(false)}
        nombre={nombreNegocio || slug}
        slug={slug}
      />
    </Pantalla>
  );
}