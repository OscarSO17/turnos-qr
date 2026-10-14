import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Pantalla from "../componentes/Pantalla";
import { crearNegocio } from "../api";
import { claveToken } from "../sesion";

type Creado = { nombre: string; slug: string; token: string };

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
        <h1 className="text-2xl font-bold text-slate-800">Turnos QR</h1>
        <p className="mt-2 text-slate-500">
          Crea tu negocio y obtén un QR para que tus clientes tomen turno desde
          el celular.
        </p>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de tu negocio"
          maxLength={80}
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
        />
        <button
          onClick={crear}
          disabled={enviando}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {enviando ? "Creando..." : "Crear mi negocio"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-xs text-slate-400">
          ¿Eres cliente? Escanea el QR que está en el negocio.
        </p>
      </Pantalla>
    );
  }

  const enlaceClientes = `${window.location.origin}/n/${creado.slug}`;

  return (
    <Pantalla>
      <h1 className="text-xl font-bold text-slate-800">{creado.nombre}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Imprime este QR y pégalo donde tus clientes lo vean.
      </p>

      <div className="mt-4 flex justify-center">
        <QRCodeSVG value={enlaceClientes} size={200} />
      </div>
      <p className="mt-2 break-all text-xs text-slate-400">{enlaceClientes}</p>

      <button
        onClick={() => window.print()}
        className="print:hidden mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
      >
        Imprimir QR
      </button>

      <div className="print:hidden mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
        <p className="text-sm font-semibold text-amber-800">
          Tu código de administrador
        </p>
        <p className="mt-1 break-all font-mono text-xs text-slate-700">
          {creado.token}
        </p>
        <button
          onClick={copiar}
          className="mt-3 rounded-lg bg-amber-600 px-3 py-1 text-sm font-semibold text-white hover:bg-amber-700"
        >
          {copiado ? "¡Copiado!" : "Copiar código"}
        </button>
        <p className="mt-2 text-xs text-amber-700">
          Guárdalo en un lugar seguro. No se vuelve a mostrar y lo necesitas
          para entrar al panel desde otro dispositivo.
        </p>
      </div>

      <Link
        to={`/panel/${creado.slug}`}
        className="print:hidden mt-6 block w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Ir a mi panel
      </Link>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Pantalla>
  );
}