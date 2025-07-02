import { AppContainer } from '@/components/app-container'

import LoginForm from './_components/login-form'

export default function LoginPage() {
  return (
    <AppContainer className="flex h-screen items-center justify-center !pt-0">
      <LoginForm />
    </AppContainer>
  )
}
