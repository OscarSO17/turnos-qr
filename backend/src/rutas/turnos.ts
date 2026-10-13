import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/:codigo", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         t.numero,
         t.estado,
         n.nombre AS negocio,
         (SELECT COUNT(*) FROM turnos x
           WHERE x.negocio_id = t.negocio_id
             AND x.estado = 'esperando'
             AND x.numero < t.numero) AS delante,
         (SELECT x.numero FROM turnos x
           WHERE x.negocio_id = t.negocio_id
             AND x.estado = 'atendiendo'
           ORDER BY x.numero DESC
           LIMIT 1) AS atendiendo_ahora
       FROM turnos t
       JOIN negocios n ON n.id = t.negocio_id
       WHERE t.codigo = $1`,
      [req.params.codigo]
    );

    if (resultado.rows.length === 0) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }

    const fila = resultado.rows[0];
    res.json({
      negocio: fila.negocio,
      numero: fila.numero,
      estado: fila.estado,
      delante: Number(fila.delante),
      atendiendo_ahora: fila.atendiendo_ahora,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/:codigo/cancelar", async (req, res) => {
  try {
    const cancelado = await pool.query(
      `UPDATE turnos
       SET estado = 'cancelado'
       WHERE codigo = $1 AND estado = 'esperando'
       RETURNING numero`,
      [req.params.codigo]
    );

    if (cancelado.rowCount === 1) {
      res.json({ numero: cancelado.rows[0].numero, estado: "cancelado" });
      return;
    }

    const existente = await pool.query(
      "SELECT estado FROM turnos WHERE codigo = $1",
      [req.params.codigo]
    );

    if (existente.rows.length === 0) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }

    res.status(409).json({
      error: `Este turno ya no se puede cancelar (estado: ${existente.rows[0].estado})`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;