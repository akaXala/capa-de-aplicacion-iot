import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardForklift from './DashboardForklift';

export default async function DashboardPage() {
  const user = await currentUser();

  // Si no está autenticado, redirigir al login
  if (!user) {
    redirect('/sign-in');
  }

  const role = user.publicMetadata?.role as string | undefined;

  // Si no tiene rol asignado, redirigir a Onboarding
  if (!role) {
    redirect('/onboarding');
  }

  // Si no es admin, redirigir a su panel correspondiente
  if (role !== 'admin') {
    redirect('/trabajador');
  }

  // Es admin, renderizar el dashboard del montacargas
  return <DashboardForklift />;
}