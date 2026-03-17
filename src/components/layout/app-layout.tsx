'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, Wrench, Package } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  console.log('🔍 AppLayout renderizado - user role:', user?.role);
  console.log('🔍 Pathname actual:', pathname);
  console.log('🔍 Debería mostrar Materia Prima:', pathname.startsWith('/dashboard/materia-prima'));

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ShieldCheck className="text-primary" />
              </Link>
            </Button>
            <h2 className="text-lg font-semibold font-headline tracking-tight group-data-[collapsible=icon]:hidden">
              Area de calidad 
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {user.role === 'jefe' && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/supervisores')}
                  tooltip="Supervisores"
                >
                  <Link href="/dashboard/supervisores">
                    <Users />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Supervisores
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard/materia-prima')}
                tooltip="Materia Prima"
              >
                <Link href="/dashboard/materia-prima">
                  <Package />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Materia Prima
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             {user.role === 'tecnico' && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/tecnico')}
                  tooltip="Técnico"
                >
                  <Link href="/tecnico">
                    <Wrench />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Técnico
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger />
          <div className="w-full flex-1">
            {/* Can add a search bar here in the future */}
          </div>
          <Button variant="outline" onClick={() => logout()}>Cerrar Sesión</Button>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
