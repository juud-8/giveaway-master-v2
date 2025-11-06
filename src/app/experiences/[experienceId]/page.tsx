'use client';

import { useSearchParams } from 'next/navigation';
import Dashboard from '@/app/page';

export default function Experience() {
  const searchParams = useSearchParams();
  const experienceId = searchParams.get('experienceId');

  return <Dashboard />;
}
