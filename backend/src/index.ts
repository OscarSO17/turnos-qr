import express from "express";

const app = express();
const PUERTO = 3000;

app.get("/salud", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});