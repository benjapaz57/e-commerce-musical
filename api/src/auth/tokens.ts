import { createHash, randomBytes } from 'node:crypto';

// Token aleatorio para enlaces de un solo uso. Al usuario le llega el token;
// en la base se guarda solo su hash, así una filtración de la base no sirve para usarlos.
export function createOneTimeToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
