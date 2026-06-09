'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export async function selectUserRole(role: 'admin' | 'trabajador') {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('No autenticado');
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error al actualizar rol del usuario:', error);
    return { success: false, error: error.message || 'Error al actualizar el rol' };
  }
}
