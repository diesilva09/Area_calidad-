'use client';

import '@/lib/react-dom-patch';
import { useAuth } from '@/contexts/auth-context';
import AuthLoading from './auth-loading';

interface AuthLayoutClientProps {
  children: React.ReactNode;
}

export default function AuthLayoutClient({ children }: AuthLayoutClientProps) {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
