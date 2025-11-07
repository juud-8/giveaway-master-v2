'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/app/page';

export default function WhopExperience() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Get companyId from URL or Whop context
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('companyId') || 'biz_NeZJ3r0YZTjTCQ'; // Fallback to your test company

    if (companyId) {
      router.push(`/?companyId=${companyId}`);
    }
  }, [router]);

  if (!mounted) return null;

  return <Dashboard />;
}
