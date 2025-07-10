import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface UserDropdownProps {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
  }
  logout: () => void
}

const UserDropdown = ({ user, logout }: UserDropdownProps) => {
  const [imageError, setImageError] = React.useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative h-8 w-8 rounded-full border border-black p-0"
        >
          {user.image && !imageError ? (
            <div className="relative h-full w-full">
              <Image
                src={user.image}
                alt={user.name ?? 'User'}
                fill
                className="rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center rounded-full">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user.name}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="flex w-full cursor-pointer items-center"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex w-full cursor-pointer items-center"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/billing"
            className="flex w-full cursor-pointer items-center"
          >
            <CreditCardIcon className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start font-normal text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
