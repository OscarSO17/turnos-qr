import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../db";
import { autenticarDueno } from "../middleware/autenticarDueno";

const router = Router();

function crearSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

router.post("/", async (req, res) => {
  const nombre =
    typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";

  if (nombre.length < 2 || nombre.length > 80) {
    res
      .status(400)
      .json({ error: "El nombre debe tener entre 2 y 80 caracteres" });
    return;
  }

  const slug = crearSlug(nombre);
  if (!slug) {
    res.status(400).json({ error: "El nombre debe incluir letras o números" });
    return;
  }

  const tokenAdmin = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(tokenAdmin).digest("hex");

  try {
    const resultado = await pool.query(
      `INSERT INTO negocios (nombre, slug, token_admin)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, slug, creado_en`,
      [nombre, slug, tokenHash]
    );
    res.status(201).json({ ...resultado.rows[0], token_admin: tokenAdmin });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Ya existe un negocio con ese nombre" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT nombre, slug FROM negocios WHERE slug = $1",
      [req.params.slug]
    );
    if (resultado.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:slug/turnos", async (req, res) => {
  const nombreCliente =
    typeof req.body?.nombre_cliente === "string" &&
    req.body.nombre_cliente.trim() !== ""
      ? req.body.nombre_cliente.trim().slice(0, 60)
      : null;

  const codigo = randomBytes(16).toString("hex");

  try {
    for (let intento = 0; intento < 5; intento++) {
      try {
        const resultado = await pool.query(
          `INSERT INTO turnos (negocio_id, numero, codigo, nombre_cliente)
           SELECT n.id, COALESCE(MAX(t.numero), 0) + 1, $2, $3
           FROM negocios n
           LEFT JOIN turnos t ON t.negocio_id = n.id
           WHERE n.slug = $1
           GROUP BY n.id
           RETURNING numero, estado`,
          [req.params.slug, codigo, nombreCliente]
        );

        if (resultado.rowCount === 0) {
          res.status(404).json({ error: "Negocio no encontrado" });
          return;
        }

        const { numero, estado } = resultado.rows[0];
        res.status(201).json({ numero, estado, codigo });
        return;
      } catch (error) {
        if ((error as { code?: string }).code !== "23505") {
          throw error;
        }
        // Otro cliente tomó ese número al mismo tiempo: reintentamos.
      }
    }

    res
      .status(503)
      .json({ error: "Hay mucha demanda, intenta de nuevo en un momento" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:slug/fila", autenticarDueno, async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT numero, nombre_cliente, estado, creado_en
       FROM turnos
       WHERE negocio_id = $1 AND estado IN ('esperando', 'atendiendo')
       ORDER BY numero`,
      [res.locals.negocioId]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:slug/siguiente", autenticarDueno, async (_req, res) => {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");

    // Bloquea el negocio para que dos "Siguiente" simultáneos no se pisen.
    await cliente.query("SELECT id FROM negocios WHERE id = $1 FOR UPDATE", [
      res.locals.negocioId,
    ]);

    await cliente.query(
      `UPDATE turnos SET estado = 'terminado'
       WHERE negocio_id = $1 AND estado = 'atendiendo'`,
      [res.locals.negocioId]
    );

    const siguiente = await cliente.query(
      `UPDATE turnos
       SET estado = 'atendiendo', atendido_en = now()
       WHERE id = (
         SELECT id FROM turnos
         WHERE negocio_id = $1 AND estado = 'esperando'
         ORDER BY numero
         LIMIT 1
       )
       RETURNING numero, nombre_cliente`,
      [res.locals.negocioId]
    );

    await cliente.query("COMMIT");
    res.json({ atendiendo: siguiente.rows[0] ?? null });
  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    cliente.release();
  }
});

export default router;