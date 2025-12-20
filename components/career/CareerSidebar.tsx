'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, Plus, Settings, Layout } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useAuth } from '@/hooks/use-auth';

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive?: boolean;
}

function SidebarLink({ href, label, icon: Icon, isActive }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}

export function CareerSidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const menuItems = [
    {
      href: '/career',
      label: 'Open Positions',
      icon: Briefcase,
    },
    ...(isAuthenticated
      ? [
          {
            href: '/career/admin/jobs/new',
            label: 'Create Position',
            icon: Plus,
          },
          {
            href: '/career/my-applications',
            label: 'My Applications',
            icon: FileText,
          },
          {
            href: '/career/admin',
            label: 'Manage Career',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:block w-64 bg-card border-r border-border h-full sticky top-0">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <Layout className="w-5 h-5" />
            Career
          </h2>
          <p className="text-sm text-muted-foreground">
            Job opportunities & management
          </p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

