CREATE TABLE negocios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  token_admin TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  negocio_id INTEGER NOT NULL REFERENCES negocios(id),
  numero INTEGER NOT NULL,
  codigo TEXT NOT NULL,
  nombre_cliente TEXT,
  estado TEXT NOT NULL DEFAULT 'esperando'
    CHECK (estado IN ('esperando', 'atendiendo', 'terminado', 'cancelado')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  atendido_en TIMESTAMPTZ,
  UNIQUE (negocio_id, numero)
);