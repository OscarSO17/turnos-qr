const API_URL = import.meta.env.VITE_API_URL;

export type Negocio = { nombre: string; slug: string };

export type Turno = {
  negocio: string;
  numero: number;
  estado: "esperando" | "atendiendo" | "terminado" | "cancelado";
  delante: number;
  atendiendo_ahora: number | null;
};

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos.error ?? "Algo salió mal");
  }
  return datos as T;
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