import { SignIn } from '@clerk/nextjs';
import { Radio } from 'lucide-react';

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Luces de fondo ambientales de diseño premium */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-emerald-500">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Monitoreo IoT Montacargas</h2>
          <p className="text-sm text-slate-400">Inicia sesión para acceder a la plataforma</p>
        </div>

        <div className="flex justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-2xl backdrop-blur-md">
          <SignIn 
            appearance={{
              elements: {
                card: 'bg-transparent shadow-none border-none p-0 w-full',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                footerAction: 'text-emerald-400 hover:text-emerald-300 transition-colors',
                formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg hover:shadow-emerald-950/20 transition-all border-none py-2.5 rounded-lg',
                formFieldLabel: 'text-slate-300 font-medium text-xs',
                formFieldInput: 'bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3',
                dividerLine: 'bg-slate-800',
                dividerText: 'text-slate-500 bg-slate-900/40',
                socialButtonsBlockButton: 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 transition-all rounded-lg',
                socialButtonsBlockButtonText: 'text-slate-200 font-normal',
                identityPreviewText: 'text-slate-200',
                identityPreviewEditButton: 'text-emerald-400 hover:text-emerald-300',
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
