'use client'

import Link from 'next/link'
import { useState } from 'react'

import { IconPackage } from '@tabler/icons-react'

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
} from '@/components/ui/navbar'

import useSystemTheme from '@/hooks/use-system-theme'

import ThemeToggle from './ui/theme-toggler'

const navItems = [
  {
    name: 'Profile',
    href: '/profile',
  },
  {
    name: 'Services',
    href: '/services',
  },
]

export function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme } = useSystemTheme()

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo
          icon={
            <IconPackage
              size={32}
              color={theme === 'dark' ? 'white' : 'black'}
            />
          }
          companyName="ACME"
          logoWidth={60}
          logoHeight={60}
        />
        <NavItems items={navItems} />
        <div className="z-90 flex items-center gap-6">
          <ThemeToggle />
          <NavbarButton variant="gradient" href="/login">
            Login
          </NavbarButton>
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
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex w-full flex-col gap-4">
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              href="/login"
              variant="gradient"
              className="w-full"
            >
              Login
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
