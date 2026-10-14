import { Link, Route, Routes } from "react-router-dom";
import Pantalla from "./componentes/Pantalla";
import Inicio from "./paginas/Inicio";
import TomarTurno from "./paginas/TomarTurno";
import MiTurno from "./paginas/MiTurno";
import Panel from "./paginas/Panel";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/n/:slug" element={<TomarTurno />} />
      <Route path="/turno/:codigo" element={<MiTurno />} />
      <Route path="/panel/:slug" element={<Panel />} />
      <Route
        path="*"
        element={
          <Pantalla>
            <h1 className="text-xl font-bold text-slate-800">
              Página no encontrada
            </h1>
            <Link to="/" className="mt-4 block text-indigo-600 underline">
              Volver al inicio
            </Link>
          </Pantalla>
        }
      />
    </Routes>
  );
}

export default App;