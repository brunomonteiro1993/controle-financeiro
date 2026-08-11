export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return confirm.length > 0 && password === confirm;
}

export const strengthMeta: Record<
  Exclude<PasswordStrength, 'empty'>,
  { label: string; bar: string; width: string }
> = {
  weak: { label: 'Fraca', bar: 'bg-danger', width: 'w-1/3' },
  medium: { label: 'Média', bar: 'bg-accent', width: 'w-2/3' },
  strong: { label: 'Forte', bar: 'bg-ok', width: 'w-full' },
};
