export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) {
    return '*'.repeat(phone.length);
  }
  const last4 = phone.slice(-4);
  return `${'*'.repeat(Math.max(phone.length - 4, 4))}${last4}`;
}
