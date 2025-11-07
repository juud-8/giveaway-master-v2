'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/app/page';

export default function WhopExperience() {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('companyId');
    
    if (cid) {
      setCompanyId(cid);
    }
  }, []);

  if (companyId) {
    return <Dashboard />;
  }

  return <Dashboard />;
}
