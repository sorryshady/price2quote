import { AppContainer } from '@/components/app-container';

import LoginForm from './_components/login-form';

export default function LoginPage() {
  return (
    <AppContainer className="h-screen flex items-center justify-center !pt-0">
      <LoginForm />
    </AppContainer>
  );
}
