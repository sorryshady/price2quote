'use client'

import Link from 'next/link'
import { useState } from 'react'

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

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo
          logoUrl="/logo.png"
          companyName="ACME"
          logoWidth={60}
          logoHeight={60}
        />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          <NavbarButton variant="gradient" href="/login">
            Login
          </NavbarButton>
          <NavbarButton variant="primary">Book a call</NavbarButton>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo
            logoUrl="/logo.png"
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
              variant="gradient"
              className="w-full"
            >
              Login
            </NavbarButton>
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full"
              variant="primary"
            >
              Book a call
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
