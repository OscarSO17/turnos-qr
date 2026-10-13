import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../db";

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

export default router;