import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Pantalla from "../componentes/Pantalla";
import { cancelarTurno, obtenerTurno, type Turno } from "../api";

export default function MiTurno() {
  const { codigo = "" } = useParams();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await obtenerTurno(codigo);
        if (activo) {
          setTurno(datos);
          setError("");
        }
      } catch (e) {
        if (activo) setError((e as Error).message);
      }
    }

    cargar();
    const id = setInterval(cargar, 5000);

    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [codigo]);

  async function cancelar() {
    if (!window.confirm("¿Seguro que quieres cancelar tu turno?")) return;
    try {
      await cancelarTurno(codigo);
      setTurno((actual) => (actual ? { ...actual, estado: "cancelado" } : actual));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!turno) {
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
      <p className="text-slate-500">{turno.negocio}</p>
      <p className="mt-4 text-sm uppercase tracking-wide text-slate-400">
        Tu turno
      </p>
      <p className="text-6xl font-bold text-indigo-600">{turno.numero}</p>

      {turno.estado === "esperando" && (
        <>
          <p className="mt-6 text-lg text-slate-700">
            {turno.delante === 0
              ? "¡Eres el siguiente!"
              : `Hay ${turno.delante} ${
                  turno.delante === 1 ? "persona" : "personas"
                } antes que tú`}
          </p>
          {turno.atendiendo_ahora !== null && (
            <p className="mt-1 text-sm text-slate-500">
              Atendiendo ahora: {turno.atendiendo_ahora}
            </p>
          )}
          <button
            onClick={cancelar}
            className="mt-6 w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
          >
            Cancelar mi turno
          </button>
          <p className="mt-3 text-xs text-slate-400">
            Esta pantalla se actualiza sola.
          </p>
        </>
      )}

      {turno.estado === "atendiendo" && (
        <p className="mt-6 text-lg font-semibold text-green-600">
          ¡Es tu turno! Pasa al mostrador.
        </p>
      )}

      {turno.estado === "terminado" && (
        <p className="mt-6 text-lg text-slate-700">Gracias por tu visita.</p>
      )}

      {turno.estado === "cancelado" && (
        <p className="mt-6 text-lg text-slate-700">Cancelaste tu turno.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Pantalla>
  );
}