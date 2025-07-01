import { AppContainer } from '@/components/app-container';

import { RegisterForm } from './_components/register-form';

export default function RegisterPage() {
  return (
    <AppContainer className="h-screen flex items-center justify-center !pt-0">
      <RegisterForm />
    </AppContainer>
  );
}
