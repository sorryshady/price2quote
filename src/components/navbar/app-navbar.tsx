'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { IconPackage } from '@tabler/icons-react'
import { Loader2, LogOutIcon, UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  NavItems,
  Navbar,
  NavbarButton,
  NavbarLogo,
} from '@/components/navbar/navbar'

import { useAuthState } from '@/hooks/use-auth'

import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import ThemeToggle from '../ui/theme-toggler'
import UserDropdown from './user-dropdown'

const navItems = [
  {
    name: 'About',
    href: '/about',
  },
  {
    name: 'Contact',
    href: '/contact',
  },
]

export function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme } = useTheme()
  const { isAuthenticated, logout, user } = useAuthState()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const logoutHandler = async () => {
    setIsLoading(true)
    await logout()
    setIsMobileMenuOpen(false)
    setIsLoading(false)
    router.push('/login')
  }

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo
          icon={
            <IconPackage
              size={32}
              color={theme === 'dark' ? 'white' : 'black'}
              suppressHydrationWarning
            />
          }
          companyName="ACME"
          logoWidth={60}
          logoHeight={60}
        />
        <NavItems items={navItems} />
        <div className="z-90 flex items-center gap-6">
          <ThemeToggle />
          {!isAuthenticated ? (
            <NavbarButton variant="gradient" href="/login">
              Login
            </NavbarButton>
          ) : (
            <UserDropdown user={user!} logout={logoutHandler} />
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo
            icon={
              <IconPackage
                size={32}
                color={theme === 'dark' ? 'white' : 'black'}
                suppressHydrationWarning
              />
            }
            companyName="ACME"
            logoWidth={60}
            logoHeight={60}
          />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            action={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen}>
          <ThemeToggle expanded={true} />
          <Separator />
          {navItems.map((item, idx) => {
            return (
              <Link
                key={`mobile-link-${idx}`}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </Link>
            )
          })}
          <Separator />
          <div className="flex w-full flex-col gap-4">
            {!isAuthenticated ? (
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                href="/login"
                variant="gradient"
                className="w-full"
              >
                Login
              </NavbarButton>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex w-full items-center justify-between px-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">
                      {user?.name}
                    </p>
                    <p className="text-muted-foreground text-xs leading-none">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      asChild
                      disabled={isLoading}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <Separator />
                <Button
                  variant="destructive"
                  onClick={logoutHandler}
                  disabled={isLoading}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm">Logout</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
