import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Boleto from "../componentes/Boleto";
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
          <p className="text-acento-oscuro">{error}</p>
        ) : (
          <p className="text-tinta-suave">Cargando...</p>
        )}
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Boleto etiqueta="Tu turno" titulo={turno.negocio}>
        <p className="font-numero text-[0.7rem] uppercase tracking-[0.3em] text-tinta-suave">
          Número
        </p>
        <p className="mt-1 font-numero text-8xl font-medium leading-none">
          {turno.numero}
        </p>

        <div aria-live="polite" className="mt-6">
          {turno.estado === "esperando" && (
            <>
              <p className="font-titulo text-xl">
                {turno.delante === 0
                  ? "Eres el siguiente"
                  : `Hay ${turno.delante} ${
                      turno.delante === 1 ? "persona" : "personas"
                    } antes que tú`}
              </p>
              {turno.atendiendo_ahora !== null && (
                <p className="mt-1 font-numero text-xs text-tinta-suave">
                  Atendiendo ahora: {turno.atendiendo_ahora}
                </p>
              )}
            </>
          )}

          {turno.estado === "atendiendo" && (
            <>
              <p className="font-titulo text-2xl text-ok">Es tu turno</p>
              <p className="mt-1 text-sm text-tinta-suave">
                Pasa al mostrador.
              </p>
            </>
          )}

          {turno.estado === "terminado" && (
            <p className="font-titulo text-xl">Gracias por tu visita.</p>
          )}

          {turno.estado === "cancelado" && (
            <p className="font-titulo text-xl">Cancelaste tu turno.</p>
          )}
        </div>

        {turno.estado === "esperando" && (
          <>
            <button
              onClick={cancelar}
              className="mt-6 text-sm text-tinta-suave underline underline-offset-4 hover:text-acento"
            >
              Cancelar mi turno
            </button>
            <p className="mt-3 text-xs text-tinta-suave">
              Esta pantalla se actualiza sola.
            </p>
          </>
        )}

        {error && <p className="mt-3 text-sm text-acento-oscuro">{error}</p>}
      </Boleto>
    </Pantalla>
  );
}