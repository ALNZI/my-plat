'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminForgotPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/forgot-password');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
