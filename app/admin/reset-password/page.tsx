'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Forward any hash or search parameters to the standard /reset-password route
    const hash = window.location.hash;
    const search = window.location.search;
    router.replace(`/reset-password${search}${hash}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
