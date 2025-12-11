'use client';

import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authenticate } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function LoginForm() {
  const [email, setEmail] = useState('agent@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await authenticate(email, password);
      const redirect = searchParams.get('redirect') || '/overview';
      router.push(redirect as any);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Agent sign in</CardTitle>
          <p className="text-sm text-[var(--color-muted)]">Secure access with tenant/role isolation.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit} aria-label="Login form">
            <div>
              <label className="text-sm font-semibold">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required aria-label="Email" />
            </div>
            <div>
              <label className="text-sm font-semibold">Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required aria-label="Password" />
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
