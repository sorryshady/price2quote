import { AppContainer } from '@/components/app-container'

import VerifyEmail from '@/email-templates/verify-email'

import profileImage from '/public/profile.jpeg'

export default function AboutPage() {
  return (
    <AppContainer>
      <div>AboutPage</div>
      <VerifyEmail
        userName="Ada Lovelace"
        userImage={profileImage.src}
        verificationUrl={`https://www.google.com`}
        requestIp="192.168.1.1"
        requestLocation="London, UK"
      />
    </AppContainer>
  )
}
