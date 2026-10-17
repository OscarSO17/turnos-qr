import { Link, Route, Routes } from "react-router-dom";
import AvisoServidor from "./componentes/AvisoServidor";
import Pantalla from "./componentes/Pantalla";
import Inicio from "./paginas/Inicio";
import TomarTurno from "./paginas/TomarTurno";
import MiTurno from "./paginas/MiTurno";
import Panel from "./paginas/Panel";

function App() {
  return (
    <>
      <AvisoServidor />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/n/:slug" element={<TomarTurno />} />
        <Route path="/turno/:codigo" element={<MiTurno />} />
        <Route path="/panel/:slug" element={<Panel />} />
        <Route
          path="*"
          element={
            <Pantalla>
              <h1 className="font-titulo text-3xl leading-tight">
                Página no encontrada
              </h1>
              <Link
                to="/"
                className="mt-4 inline-block text-acento underline underline-offset-4"
              >
                Volver al inicio
              </Link>
            </Pantalla>
          }
        />
      </Routes>
    </>
  );
}

export default App;