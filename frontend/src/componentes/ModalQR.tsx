import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  nombre: string;
  slug: string;
};

export default function ModalQR({ abierto, onCerrar, nombre, slug }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (abierto && !el.open) el.showModal();
    if (!abierto && el.open) el.close();
  }, [abierto]);

  const enlace = `${window.location.origin}/n/${slug}`;

  function descargar() {
    const canvas = lienzo.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${slug}.png`;
    a.click();
  }

  function imprimir() {
    const canvas = lienzo.current;
    if (!canvas) return;
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    ventana.document.title = nombre;

    const estilo = ventana.document.createElement("style");
    estilo.textContent =
      "@page{margin:0}" +
      "body{margin:0;min-height:100vh;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;font-family:Georgia,serif;text-align:center}" +
      "h1{font-size:2.4rem;margin:0 0 1rem}" +
      "img{width:14cm;height:14cm}";

    const titulo = ventana.document.createElement("h1");
    titulo.textContent = nombre;

    const imagen = ventana.document.createElement("img");
    imagen.onload = () => ventana.print();
    imagen.src = canvas.toDataURL("image/png");

    ventana.document.head.append(estilo);
    ventana.document.body.append(titulo, imagen);
  }

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      className="m-auto w-[min(92vw,24rem)] rounded-md border border-linea bg-boleto p-6 text-center text-tinta backdrop:bg-tinta/60"
    >
      <h2 className="font-titulo text-2xl leading-tight">{nombre}</h2>

      <div className="mt-4 flex justify-center">
        <QRCodeCanvas
          ref={lienzo}
          value={enlace}
          size={1024}
          marginSize={4}
          style={{ width: "15rem", height: "15rem" }}
        />
      </div>

      <p className="mt-2 break-all font-numero text-xs text-tinta-suave">
        {enlace}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={descargar}
          className="rounded-md bg-acento px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-acento-oscuro"
        >
          Descargar PNG
        </button>
        <button
          onClick={imprimir}
          className="rounded-md border border-linea px-3 py-2.5 text-sm transition-colors hover:bg-papel"
        >
          Imprimir
        </button>
      </div>

      <button
        onClick={onCerrar}
        className="mt-4 text-sm text-tinta-suave underline underline-offset-4 hover:text-acento"
      >
        Cerrar
      </button>
    </dialog>
  );
}