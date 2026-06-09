import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardForklift from './DashboardForklift';

export default async function DashboardPage() {
  const user = await currentUser();

  // Si no está autenticado, redirigir al login
  if (!user) {
    redirect('/sign-in');
  }

  // Renderizar el dashboard del montacargas
  return <DashboardForklift />;
}