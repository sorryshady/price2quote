import { redirect } from 'next/navigation'

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import { getUser } from '@/lib/auth'

import { ProtectedContent } from './_components/protected-content'
import { AppSidebar } from './dashboard/_components/app-sidebar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="m-2">
          <header className="flex h-[2rem] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[2rem]">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <div className="border-sidebar-border h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-md border p-4 shadow">
            <ProtectedContent>{children}</ProtectedContent>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
