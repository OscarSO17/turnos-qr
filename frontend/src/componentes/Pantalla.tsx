import type { ReactNode } from "react";

export default function Pantalla({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        {children}
      </div>
    </main>
  );
}