'use client';

import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CareerAdminLink() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <Link href="/career/admin">
        <Button
          variant="outline"
          size="sm"
          className="shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Jobs
        </Button>
      </Link>
    </div>
  );
}

