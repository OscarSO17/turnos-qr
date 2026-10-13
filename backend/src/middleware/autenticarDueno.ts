import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";

export async function autenticarDueno(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const encabezado = req.get("authorization") ?? "";
  const token = encabezado.startsWith("Bearer ")
    ? encabezado.slice(7).trim()
    : "";

  if (!token) {
    res.status(401).json({ error: "Falta el código de administrador" });
    return;
  }

  const hash = createHash("sha256").update(token).digest("hex");

  try {
    const resultado = await pool.query(
      "SELECT id FROM negocios WHERE slug = $1 AND token_admin = $2",
      [req.params.slug, hash]
    );

    if (resultado.rows.length === 0) {
      res.status(401).json({ error: "Código de administrador incorrecto" });
      return;
    }

    res.locals.negocioId = resultado.rows[0].id;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}