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

export default router;