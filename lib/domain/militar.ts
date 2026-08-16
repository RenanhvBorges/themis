// Validações de identificação do militar, compartilhadas entre o login e o
// cadastro administrativo de usuários (lib/actions/auth.ts, lib/actions/usuarios.ts).

export function saramValido(saram: string): boolean {
  return /^\d{6,8}$/.test(saram);
}
