import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { pool } from "../db";

const slugsCreados: string[] = [];

function nombreUnico() {
  return `Prueba ${randomUUID().slice(0, 8)}`;
}

async function crearNegocio() {
  const respuesta = await request(app)
    .post("/negocios")
    .send({ nombre: nombreUnico() });
  slugsCreados.push(respuesta.body.slug);
  return {
    slug: respuesta.body.slug as string,
    token: respuesta.body.token_admin as string,
  };
}

async function tomarTurno(slug: string) {
  const respuesta = await request(app)
    .post(`/negocios/${slug}/turnos`)
    .send({});
  return {
    status: respuesta.status,
    numero: respuesta.body.numero as number,
    codigo: respuesta.body.codigo as string,
  };
}

async function consultar(codigo: string) {
  const respuesta = await request(app).get(`/turnos/${codigo}`);
  return respuesta.body as {
    numero: number;
    estado: string;
    delante: number;
    atendiendo_ahora: number | null;
  };
}

afterAll(async () => {
  if (slugsCreados.length > 0) {
    await pool.query(
      "DELETE FROM turnos WHERE negocio_id IN (SELECT id FROM negocios WHERE slug = ANY($1))",
      [slugsCreados]
    );
    await pool.query("DELETE FROM negocios WHERE slug = ANY($1)", [
      slugsCreados,
    ]);
  }
  await pool.end();
});

describe("negocios", () => {
  it("rechaza un nombre vacío", async () => {
    const respuesta = await request(app)
      .post("/negocios")
      .send({ nombre: "   " });
    expect(respuesta.status).toBe(400);
  });

  it("no permite dos negocios con el mismo nombre", async () => {
    const nombre = nombreUnico();
    const primero = await request(app).post("/negocios").send({ nombre });
    slugsCreados.push(primero.body.slug);
    const segundo = await request(app).post("/negocios").send({ nombre });

    expect(primero.status).toBe(201);
    expect(segundo.status).toBe(409);
  });
});

describe("turnos", () => {
  it("asigna números consecutivos", async () => {
    const { slug } = await crearNegocio();
    const a = await tomarTurno(slug);
    const b = await tomarTurno(slug);
    const c = await tomarTurno(slug);

    expect([a.numero, b.numero, c.numero]).toEqual([1, 2, 3]);
  });

  it("no repite números cuando varios clientes piden a la vez", async () => {
    const { slug } = await crearNegocio();
    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => tomarTurno(slug))
    );

    expect(resultados.every((r) => r.status === 201)).toBe(true);
    const numeros = resultados.map((r) => r.numero).sort((x, y) => x - y);
    expect(numeros).toEqual([1, 2, 3, 4, 5]);
  });

  it("responde 404 si el negocio no existe", async () => {
    const respuesta = await request(app)
      .post("/negocios/no-existe-ninguno/turnos")
      .send({});
    expect(respuesta.status).toBe(404);
  });

  it("adelanta a los de atrás cuando alguien cancela", async () => {
    const { slug } = await crearNegocio();
    await tomarTurno(slug);
    const segundo = await tomarTurno(slug);
    const tercero = await tomarTurno(slug);

    expect((await consultar(tercero.codigo)).delante).toBe(2);

    const cancelado = await request(app).post(
      `/turnos/${segundo.codigo}/cancelar`
    );
    expect(cancelado.status).toBe(200);

    expect((await consultar(tercero.codigo)).delante).toBe(1);
  });

  it("no deja cancelar dos veces el mismo turno", async () => {
    const { slug } = await crearNegocio();
    const turno = await tomarTurno(slug);

    const primera = await request(app).post(`/turnos/${turno.codigo}/cancelar`);
    const segunda = await request(app).post(`/turnos/${turno.codigo}/cancelar`);

    expect(primera.status).toBe(200);
    expect(segunda.status).toBe(409);
  });
});

describe("panel del dueño", () => {
  it("exige el código de administrador", async () => {
    const { slug, token } = await crearNegocio();

    const sinCodigo = await request(app).get(`/negocios/${slug}/fila`);
    const codigoFalso = await request(app)
      .get(`/negocios/${slug}/fila`)
      .set("Authorization", "Bearer codigo-falso");
    const codigoBueno = await request(app)
      .get(`/negocios/${slug}/fila`)
      .set("Authorization", `Bearer ${token}`);

    expect(sinCodigo.status).toBe(401);
    expect(codigoFalso.status).toBe(401);
    expect(codigoBueno.status).toBe(200);
  });

  it("llama a los turnos en orden y termina el anterior", async () => {
    const { slug, token } = await crearNegocio();
    const a = await tomarTurno(slug);
    const b = await tomarTurno(slug);
    const autorizacion = `Bearer ${token}`;
    const siguiente = () =>
      request(app)
        .post(`/negocios/${slug}/siguiente`)
        .set("Authorization", autorizacion);

    const primero = await siguiente();
    expect(primero.body.atendiendo.numero).toBe(1);
    expect((await consultar(a.codigo)).estado).toBe("atendiendo");

    const segundo = await siguiente();
    expect(segundo.body.atendiendo.numero).toBe(2);
    expect((await consultar(a.codigo)).estado).toBe("terminado");
    expect((await consultar(b.codigo)).estado).toBe("atendiendo");

    const tercero = await siguiente();
    expect(tercero.body.atendiendo).toBeNull();
    expect((await consultar(b.codigo)).estado).toBe("terminado");
  });
});