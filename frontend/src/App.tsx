import { Route, Routes } from "react-router-dom";
import Pantalla from "./componentes/Pantalla";
import TomarTurno from "./paginas/TomarTurno";
import MiTurno from "./paginas/MiTurno";
import Panel from "./paginas/Panel";

function App() {
  return (
    <Routes>
      <Route path="/n/:slug" element={<TomarTurno />} />
      <Route path="/turno/:codigo" element={<MiTurno />} />
      <Route path="/panel/:slug" element={<Panel />} />
      <Route
        path="*"
        element={
          <Pantalla>
            <h1 className="text-2xl font-bold text-slate-800">Turnos QR</h1>
            <p className="mt-2 text-slate-500">
              Escanea el código QR del negocio para tomar tu turno.
            </p>
          </Pantalla>
        }
      />
    </Routes>
  );
}

export default App;