import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Radio, ArrowRight, ShieldCheck, Cpu, Key, Database } from 'lucide-react';

export default async function HomePage() {
  const user = await currentUser();

  // Si está autenticado, controlar el tráfico según su rol
  if (user) {
    const role = user.publicMetadata?.role as string | undefined;

    if (!role) {
      redirect('/onboarding');
    }

    if (role === 'admin') {
      redirect('/dashboard');
    }

    if (role === 'trabajador') {
      redirect('/trabajador');
    }
  }

  // Si no está autenticado, mostrar landing page premium para invitados
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
      {/* Luces de fondo ambientales decorativas */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-96 w-96 rounded-full bg-blue-500/5 blur-[100px]" />

      <div className="w-full max-w-4xl space-y-12 text-center">
        {/* Logo e Insignia */}
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-emerald-500 shadow-xl">
            <Radio className="h-8 w-8 animate-pulse text-emerald-400" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Capa de Aplicación IoT • MQTT & RFID
          </span>
        </div>

        {/* Título Principal */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Monitoreo & Seguridad <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              de Montacargas IoT
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Plataforma de telemetría en tiempo real y control de acceso vehicular por RFID, asegurando la bodega mediante autenticación centralizada.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/sign-in"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-500 hover:scale-[1.02] w-full sm:w-auto"
          >
            Iniciar Sesión
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full border border-slate-800 bg-slate-900/40 px-8 text-sm font-bold text-slate-200 transition-all hover:bg-slate-900 hover:border-slate-700 w-full sm:w-auto backdrop-blur-md"
          >
            Registrarse
          </Link>
        </div>

        {/* Características Técnicas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-8 border-t border-slate-900">
          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 text-left backdrop-blur-sm">
            <div className="mb-3 rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 w-fit">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Control de Ignición</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-normal">
              Previene el encendido sin autorización previa del lector RFID en cabina.
            </p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 text-left backdrop-blur-sm">
            <div className="mb-3 rounded-lg bg-blue-500/10 p-2.5 text-blue-400 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Alertas Críticas</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-normal">
              Notificación instantánea de intentos de arranque violando los circuitos de cabina.
            </p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 text-left backdrop-blur-sm">
            <div className="mb-3 rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 w-fit">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Datos en Tiempo Real</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-normal">
              Logs de telemetría y estado de ignición sincronizados vía Supabase y MQTT.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
