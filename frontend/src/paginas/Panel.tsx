import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Pantalla from "../componentes/Pantalla";
import ModalQR from "../componentes/ModalQR";
import { claveToken as clave } from "../sesion";
import {
  ErrorApi,
  llamarSiguiente,
  obtenerFila,
  obtenerNegocio,
  type TurnoFila,
} from "../api";

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
        <h1 className="text-xl font-bold text-slate-800">Panel del negocio</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ingresa tu código de administrador.
        </p>
        <input
          type="password"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Código de administrador"
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
        />
        <button
          onClick={entrar}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Entrar
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Pantalla>
    );
  }

  const atendiendo = fila.find((t) => t.estado === "atendiendo");
  const esperando = fila.filter((t) => t.estado === "esperando");

  return (
    <Pantalla>
      <h1 className="text-xl font-bold text-slate-800">Panel del negocio</h1>
      <p className="text-sm text-slate-500">{nombreNegocio || slug}</p>
      
      <div className="mt-6 rounded-xl bg-indigo-50 p-4">
        <p className="text-xs uppercase tracking-wide text-indigo-400">
          Atendiendo ahora
        </p>
        <p className="text-4xl font-bold text-indigo-600">
          {atendiendo ? atendiendo.numero : "—"}
        </p>
        {atendiendo?.nombre_cliente && (
          <p className="text-sm text-slate-600">{atendiendo.nombre_cliente}</p>
        )}
      </div>

      <button
        onClick={siguiente}
        disabled={ocupado || (!atendiendo && esperando.length === 0)}
        className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {esperando.length > 0
          ? "Siguiente"
          : atendiendo
            ? "Terminar turno actual"
            : "Sin turnos en espera"}
      </button>

      <h2 className="mt-6 text-left text-sm font-semibold text-slate-600">
        En espera ({esperando.length})
      </h2>
      {esperando.length === 0 ? (
        <p className="mt-2 text-left text-sm text-slate-400">
          No hay nadie esperando.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 text-left">
          {esperando.map((t) => (
            <li key={t.numero} className="flex justify-between py-2">
              <span className="font-semibold text-slate-800">{t.numero}</span>
              <span className="text-slate-500">
                {t.nombre_cliente ?? "Sin nombre"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setVerQR(true)}
          className="text-sm text-indigo-600 underline"
        >
          Ver QR
        </button>
        <button onClick={salir} className="text-xs text-slate-400 underline">
          Salir
        </button>
      </div>

      <ModalQR
        abierto={verQR}
        onCerrar={() => setVerQR(false)}
        nombre={nombreNegocio || slug}
        slug={slug}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Pantalla>
  );
}