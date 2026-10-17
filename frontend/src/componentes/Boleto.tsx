import type { ReactNode } from "react";

type Props = {
  etiqueta: string;
  titulo: string;
  children: ReactNode;
};

export default function Boleto({ etiqueta, titulo, children }: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-linea bg-boleto text-center shadow-[0_12px_30px_-20px_rgba(31,27,22,0.5)]">
      <div className="px-6 pb-5 pt-6">
        <p className="font-numero text-[0.7rem] uppercase tracking-[0.3em] text-tinta-suave">
          {etiqueta}
        </p>
        <h1 className="mt-2 font-titulo text-3xl leading-tight">{titulo}</h1>
      </div>

      <div className="relative border-t-2 border-dashed border-linea before:absolute before:-left-3 before:-top-3 before:size-6 before:rounded-full before:bg-papel after:absolute after:-right-3 after:-top-3 after:size-6 after:rounded-full after:bg-papel" />

      <div className="px-6 pb-7 pt-5">{children}</div>
    </div>
  );
}