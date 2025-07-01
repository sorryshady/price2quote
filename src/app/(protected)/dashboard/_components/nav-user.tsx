'use client'

import {
  IconCreditCard,
  IconCrown,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUser,
  IconUserCircle,
} from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { useAuth } from '@/hooks/use-auth'
import { SubscriptionTier } from '@/types'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    image?: string
    subscriptionTier: SubscriptionTier
  }
}) {
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.image} alt={user.name || 'User'} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name || 'User'}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image} alt={user.name || 'User'} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || 'US'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    {user.subscriptionTier === 'pro' ? (
                      <IconCrown className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <IconUser className="h-4 w-4 text-gray-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        user.subscriptionTier === 'pro'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {user.subscriptionTier === 'pro' ? 'Pro' : 'Free'} Plan
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer"
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
