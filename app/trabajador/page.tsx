import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import WorkerDashboard from './WorkerDashboard';

export default async function TrabajadorPage() {
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

  // Si es admin, redirigir a su panel correspondiente
  if (role === 'admin') {
    redirect('/dashboard');
  }

  // Es trabajador, renderizar su panel de control
  return (
    <WorkerDashboard 
      user={{
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl || '',
        email: user.emailAddresses[0]?.emailAddress || '',
      }}
    />
  );
}
