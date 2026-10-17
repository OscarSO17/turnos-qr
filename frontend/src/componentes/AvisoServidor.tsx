import { useEffect, useState } from "react";

export default function AvisoServidor() {
  const [lentas, setLentas] = useState(0);

  useEffect(() => {
    const alCambiar = (evento: Event) =>
      setLentas((evento as CustomEvent<number>).detail);
    window.addEventListener("api-lentas", alCambiar);
    return () => window.removeEventListener("api-lentas", alCambiar);
  }, []);

  if (lentas === 0) return null;

  return (
    <div
      role="status"
      className="print:hidden fixed inset-x-0 top-0 z-50 bg-tinta px-4 py-2 text-center text-sm text-papel"
    >
      El servidor se está iniciando en segundo plano y puede tardar hasta un minuto. No cierres
      esta pantalla.
    </div>
  );
}