import type { User } from '../generated/prisma/client.js';

// Lo que el front puede ver del usuario logueado. Nunca incluye el hash de la contraseña.
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    province: user.province,
    city: user.city,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
