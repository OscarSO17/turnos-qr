import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Boleto from "../componentes/Boleto";
import Pantalla from "../componentes/Pantalla";
import { crearNegocio } from "../api";
import { claveToken } from "../sesion";

type Creado = { nombre: string; slug: string; token: string };

const claseEtiqueta =
  "font-numero text-[0.7rem] uppercase tracking-[0.3em] text-tinta-suave";

export default function Inicio() {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<Creado | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function crear() {
    const limpio = nombre.trim();
    if (limpio.length < 2) {
      setError("Escribe el nombre de tu negocio");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const negocio = await crearNegocio(limpio);
      localStorage.setItem(claveToken(negocio.slug), negocio.token_admin);
      setCreado({
        nombre: negocio.nombre,
        slug: negocio.slug,
        token: negocio.token_admin,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    if (!creado) return;
    try {
      await navigator.clipboard.writeText(creado.token);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar. Selecciona el código y cópialo a mano.");
    }
  }

  if (!creado) {
    return (
      <Pantalla>
        <Boleto etiqueta="Turnos QR" titulo="Tu fila virtual">
          <p className="text-sm text-tinta-suave">
            Crea tu negocio, imprime el QR y deja que tus clientes tomen turno
            desde el celular.
          </p>

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            placeholder="Nombre de tu negocio"
            maxLength={80}
            className="mt-5 w-full rounded-md border border-linea bg-papel px-3 py-2.5 text-center placeholder:text-tinta-suave/70 focus:border-acento focus:outline-none"
          />

          <button
            onClick={crear}
            disabled={enviando}
            className="mt-3 w-full rounded-md bg-acento px-4 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-acento-oscuro disabled:opacity-50"
          >
            {enviando ? "Creando..." : "Crear mi negocio"}
          </button>

          {error && <p className="mt-3 text-sm text-acento-oscuro">{error}</p>}

          <p className="mt-6 text-xs text-tinta-suave">
            ¿Eres cliente? Escanea el QR que está en el negocio.
          </p>
        </Boleto>
      </Pantalla>
    );
  }

  const enlaceClientes = `${window.location.origin}/n/${creado.slug}`;

  return (
    <Pantalla>
      <p className={`print:hidden ${claseEtiqueta}`}>Negocio creado</p>
      <h1 className="mt-2 font-titulo text-3xl leading-tight print:text-5xl">
        {creado.nombre}
      </h1>
      <p className="mt-2 text-sm text-tinta-suave print:hidden">
        Imprime este QR y pégalo donde tus clientes lo vean.
      </p>

      <div className="mt-6 flex justify-center">
        <div className="rounded-md border border-linea bg-white p-4 print:border-0 print:p-0">
          <QRCodeSVG
            value={enlaceClientes}
            size={200}
            className="print:size-[14cm]"
          />
        </div>
      </div>

      <p className="mt-3 break-all font-numero text-xs text-tinta-suave print:hidden">
        {enlaceClientes}
      </p>

      <button
        onClick={() => window.print()}
        className="mt-4 w-full rounded-md border border-linea px-4 py-2.5 transition-colors hover:bg-boleto print:hidden"
      >
        Imprimir QR
      </button>

      <div className="mt-6 rounded-md border border-acento/40 bg-boleto p-4 text-left print:hidden">
        <p className={claseEtiqueta}>Tu código de administrador</p>
        <p className="mt-2 break-all font-numero text-xs">{creado.token}</p>
        <button
          onClick={copiar}
          className="mt-3 rounded-md bg-tinta px-3 py-1.5 text-sm font-semibold text-papel transition-colors hover:bg-tinta/85"
        >
          {copiado ? "¡Copiado!" : "Copiar código"}
        </button>
        <p className="mt-3 text-xs text-tinta-suave">
          Guárdalo en un lugar seguro. No se vuelve a mostrar y no hay forma de
          recuperarlo; lo necesitas para entrar al panel desde otro
          dispositivo.
        </p>
      </div>

      <Link
        to={`/panel/${creado.slug}`}
        className="mt-6 block w-full rounded-md bg-acento px-4 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-acento-oscuro print:hidden"
      >
        Ir a mi panel
      </Link>

      {error && (
        <p className="mt-3 text-sm text-acento-oscuro print:hidden">{error}</p>
      )}
    </Pantalla>
  );
}