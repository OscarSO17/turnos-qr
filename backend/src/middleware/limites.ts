import rateLimit from "express-rate-limit";

const comunes = {
  standardHeaders: true,
  legacyHeaders: false,
  // Solo para desarrollo: DESACTIVAR_LIMITES=1 en el archivo .env local.
  skip: () => process.env.DESACTIVAR_LIMITES === "1",
};

export const limiteCrearNegocio = rateLimit({
  ...comunes,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: {
    error:
      "Se crearon demasiados negocios desde esta conexión. Inténtalo de nuevo en una hora.",
  },
});

export const limiteTomarTurno = rateLimit({
  ...comunes,
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: {
    error:
      "Se pidieron demasiados turnos desde esta conexión. Espera unos minutos e inténtalo de nuevo.",
  },
});

export const limiteErroresDueno = rateLimit({
  ...comunes,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.",
  },
});