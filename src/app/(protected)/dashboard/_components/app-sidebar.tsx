'use client'

import Link from 'next/link'
import * as React from 'react'

import { IconInnerShadowTop } from '@tabler/icons-react'
import {
  BarChart3,
  Briefcase,
  CirclePlusIcon,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageCircle,
  Settings,
} from 'lucide-react'

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
import { useCompanies } from '@/hooks/use-companies'

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
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
    {
      title: 'Get Help',
      url: '/help',
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { hasCompanies, isLoading: companiesLoading } = useCompanies()

  if (!user) return null

  const { name, email, image, subscriptionTier } = user

  // Show loading state while checking companies
  if (companiesLoading) {
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
          <div className="flex items-center justify-center p-4">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          </div>
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

  // Show setup nav if no companies, main nav if companies exist
  const navItems = hasCompanies ? data.navMain : data.navSetup

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
        <NavMain items={navItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
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
