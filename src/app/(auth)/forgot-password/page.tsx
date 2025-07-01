'use client';

import { AppContainer } from '@/components/app-container';

import ForgotPasswordForm from './_components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AppContainer className="h-screen flex items-center justify-center !pt-0">
      <ForgotPasswordForm />
    </AppContainer>
  );
}
