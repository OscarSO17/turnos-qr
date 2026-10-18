import "dotenv/config";

const urlPruebas = process.env.DATABASE_URL_PRUEBAS;

if (!urlPruebas) {
  throw new Error(
    "Falta DATABASE_URL_PRUEBAS. Crea una rama 'pruebas' en Neon y pega su cadena de conexión en backend/.env."
  );
}

if (urlPruebas === process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL_PRUEBAS es igual a DATABASE_URL. Las pruebas borran datos: usa una base de datos aparte."
  );
}

process.env.DATABASE_URL = urlPruebas;
process.env.DESACTIVAR_LIMITES = "1";