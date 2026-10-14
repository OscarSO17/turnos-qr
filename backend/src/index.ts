import "dotenv/config";
import express from "express";
import { pool } from "./db";
import negociosRouter from "./rutas/negocios";
import turnosRouter from "./rutas/turnos";
import cors from "cors";

const app = express();
const PUERTO = 3000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/salud", (_req, res) => {
  res.json({ ok: true });
});

app.get("/salud-bd", async (_req, res) => {
  try {
    const resultado = await pool.query("SELECT COUNT(*) AS total FROM negocios");
    res.json({ ok: true, negocios: Number(resultado.rows[0].total) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

app.use("/negocios", negociosRouter);
app.use("/turnos", turnosRouter);

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});