import { createOneTimeToken, hashToken } from './tokens.js';

describe('tokens de un solo uso', () => {
  it('el hash guardado corresponde al token enviado', () => {
    const { token, hash } = createOneTimeToken();
    expect(hashToken(token)).toBe(hash);
    expect(hash).not.toContain(token);
  });

  it('cada token es distinto', () => {
    expect(createOneTimeToken().token).not.toBe(createOneTimeToken().token);
  });
});
