import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Omitir archivos internos de Next.js y todos los archivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Ejecutar siempre para rutas de API y trpc
    '/(api|trpc)(.*)',
    // Ejecutar siempre para las rutas de frontend de Clerk
    '/__clerk/(.*)',
  ],
};
