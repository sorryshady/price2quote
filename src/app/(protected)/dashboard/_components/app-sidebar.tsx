'use client'

import Link from 'next/link'
import * as React from 'react'

import { IconInnerShadowTop } from '@tabler/icons-react'
import {
  BarChart3,
  Briefcase,
  CirclePlusIcon,
  FileImage,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageCircle,
} from 'lucide-react'

import { SidebarSkeleton } from '@/components/ui/loading-states'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const data = {
  navSetup: [
    {
      title: 'Setup Company',
      url: '/add-company',
      icon: Briefcase,
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'New Quote',
      url: '/new-quote',
      icon: CirclePlusIcon,
    },
    {
      title: 'My Quotes',
      url: '/quotes',
      icon: FileText,
    },
    {
      title: 'PDF Preview',
      url: '/pdf-preview',
      icon: FileImage,
    },
    {
      title: 'Send Email',
      url: '/send-email',
      icon: Mail,
    },
    {
      title: 'Conversations',
      url: '/conversations',
      icon: MessageCircle,
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
    },
    {
      title: 'Add Company',
      url: '/add-company',
      icon: Briefcase,
    },
  ],
  navSecondary: [
    {
      title: 'Get Help',
      url: '/help',
      icon: HelpCircle,
    },
  ],
}

function AppSidebarComponent({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, isInitialized } = useAuth()
  const { hasCompanies, isLoading } = useCompaniesQuery()

  // Memoize navigation items to prevent unnecessary re-renders
  const navItems = React.useMemo(
    () => (hasCompanies ? data.navMain : data.navSetup),
    [hasCompanies],
  )

  // Don't render if user is not available or auth not initialized
  if (!user || !isInitialized) return null

  const { name, email, image, subscriptionTier } = user

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Price2Quote</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            <NavMain items={navItems} />
            <NavSecondary items={data.navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: name || '',
            email,
            image: image || '',
            subscriptionTier,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}

AppSidebarComponent.displayName = 'AppSidebar'

export const AppSidebar = React.memo(AppSidebarComponent)
