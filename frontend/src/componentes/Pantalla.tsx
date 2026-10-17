import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  ancho?: boolean;
};

export default function Pantalla({ children, ancho = false }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className={`w-full text-center print:max-w-none ${
          ancho ? "max-w-4xl" : "max-w-sm"
        }`}
      >
        {children}
      </div>
    </main>
  );
}