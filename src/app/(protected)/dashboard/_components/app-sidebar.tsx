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

import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const initial = true

const data = {
  navInitial: [
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
      title: 'Add company',
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
  if (!user) return null
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
        <NavMain items={initial ? data.navInitial : data.navMain} />
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
