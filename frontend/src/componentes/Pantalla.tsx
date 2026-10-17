import type { ReactNode } from "react";

export default function Pantalla({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm text-center print:max-w-none">
        {children}
      </div>
    </main>
  );
}