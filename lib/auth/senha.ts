import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/**
 * Política mínima de senha no primeiro acesso (senha inicial = SARAM).
 * A nova senha não pode ser igual ao SARAM nem ter menos de 8 caracteres.
 */
export function validarNovaSenha(novaSenha: string, saram: string): string | null {
  if (novaSenha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (novaSenha === saram) return "A nova senha não pode ser igual ao SARAM.";
  if (!/[0-9]/.test(novaSenha) || !/[A-Za-z]/.test(novaSenha)) {
    return "A senha deve combinar letras e números.";
  }
  return null;
}
