'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupervisoresPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard de supervisores
    router.push('/dashboard/supervisores');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Redirigiendo...</p>
    </div>
  );
}
