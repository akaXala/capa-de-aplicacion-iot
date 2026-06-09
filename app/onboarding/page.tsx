'use client';

import { useState } from 'react';
import { selectUserRole } from './actions';
import { useSession } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Radio, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const { session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelection = async (role: 'admin' | 'trabajador') => {
    setLoading(role);
    setError(null);
    try {
      const res = await selectUserRole(role);
      if (res.success) {
        // Recargar la sesión de Clerk en el cliente para obtener el token con el nuevo rol inmediatamente
        if (session) {
          await session.reload();
        }
        // Redirigir al panel correspondiente
        if (role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/trabajador');
        }
      } else {
        setError(res.error || 'Ocurrió un error al configurar tu rol.');
        setLoading(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setLoading(null);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Luces de fondo ambientales de diseño premium */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-emerald-500 mb-2">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Configura tu Perfil
          </h1>
          <p className="max-w-md text-slate-400">
            Para continuar, selecciona tu rol de acceso en el sistema de monitoreo IoT de montacargas
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-950 bg-red-950/20 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Card Administrador */}
          <button
            onClick={() => handleRoleSelection('admin')}
            disabled={loading !== null}
            className={`group relative flex flex-col items-start rounded-2xl border bg-slate-900/40 p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${
              loading === 'admin'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-500/5'
            }`}
          >
            <div className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              Administrador
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Acceso completo al panel de telemetría IoT, supervisión de montacargas activos, resolución de alertas críticas y logs de ignición RFID.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              {loading === 'admin' ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Configurando...
                </span>
              ) : (
                <>
                  Seleccionar Administrador <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </button>

          {/* Card Trabajador */}
          <button
            onClick={() => handleRoleSelection('trabajador')}
            disabled={loading !== null}
            className={`group relative flex flex-col items-start rounded-2xl border bg-slate-900/40 p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${
              loading === 'trabajador'
                ? 'border-blue-500 ring-2 ring-blue-500/30'
                : 'border-slate-800 hover:border-blue-500/50 hover:shadow-blue-500/5'
            }`}
          >
            <div className="mb-4 rounded-xl bg-blue-500/10 p-3 text-blue-400 transition-colors group-hover:bg-blue-500/20">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Trabajador / Operador
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Panel personal de operador. Consulta tu estado de ignición asignado, reportes de turnos y simula un inicio de sesión RFID en el montacargas.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
              {loading === 'trabajador' ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Configurando...
                </span>
              ) : (
                <>
                  Seleccionar Trabajador <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
