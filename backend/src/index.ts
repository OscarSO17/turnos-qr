import "dotenv/config";
import { app } from "./app";

// Render asigna el puerto con la variable PORT; en local usamos el 3000.
const PUERTO = Number(process.env.PORT) || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});