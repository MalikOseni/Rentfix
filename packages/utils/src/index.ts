export function nowUtcISOString(): string {
  return new Date().toISOString();
}

export function secondsFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
