const API_URL = import.meta.env.VITE_API_URL;

export type Negocio = { nombre: string; slug: string };

export type Turno = {
  negocio: string;
  numero: number;
  estado: "esperando" | "atendiendo" | "terminado" | "cancelado";
  delante: number;
  atendiendo_ahora: number | null;
};

export type TurnoFila = {
  numero: number;
  nombre_cliente: string | null;
  estado: "esperando" | "atendiendo";
  creado_en: string;
};

export class ErrorApi extends Error {
  estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

// Cuántas peticiones llevan más de 4 segundos sin respuesta.
let lentas = 0;

function cambiarLentas(cambio: number) {
  lentas += cambio;
  window.dispatchEvent(new CustomEvent("api-lentas", { detail: lentas }));
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let marcada = false;
  const temporizador = setTimeout(() => {
    marcada = true;
    cambiarLentas(1);
  }, 4000);

  try {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    } catch {
      throw new ErrorApi(
        "No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.",
        0
      );
    }

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new ErrorApi(datos.error ?? "Algo salió mal", respuesta.status);
    }
    return datos as T;
  } finally {
    clearTimeout(temporizador);
    if (marcada) cambiarLentas(-1);
  }
}

function encabezadoDueno(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const obtenerNegocio = (slug: string) =>
  pedir<Negocio>(`/negocios/${encodeURIComponent(slug)}`);

export const tomarTurno = (slug: string, nombreCliente: string) =>
  pedir<{ numero: number; estado: string; codigo: string }>(
    `/negocios/${encodeURIComponent(slug)}/turnos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_cliente: nombreCliente }),
    }
  );

export const obtenerTurno = (codigo: string) =>
  pedir<Turno>(`/turnos/${encodeURIComponent(codigo)}`);

export const cancelarTurno = (codigo: string) =>
  pedir<{ estado: string }>(`/turnos/${encodeURIComponent(codigo)}/cancelar`, {
    method: "POST",
  });

export const obtenerFila = (slug: string, token: string) =>
  pedir<TurnoFila[]>(`/negocios/${encodeURIComponent(slug)}/fila`, {
    headers: encabezadoDueno(token),
  });

export const llamarSiguiente = (slug: string, token: string) =>
  pedir<{ atendiendo: { numero: number; nombre_cliente: string | null } | null }>(
    `/negocios/${encodeURIComponent(slug)}/siguiente`,
    {
      method: "POST",
      headers: encabezadoDueno(token),
    }
  );

export const crearNegocio = (nombre: string) =>
  pedir<{ id: number; nombre: string; slug: string; token_admin: string }>(
    "/negocios",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    }
  );