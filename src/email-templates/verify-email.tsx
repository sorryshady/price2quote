import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

import { env } from '@/env/client'

// NOTE: Set your base URL for images and assets used in emails
const baseUrl = env.NEXT_PUBLIC_API_URL
  ? env.NEXT_PUBLIC_API_URL
  : 'http://localhost:3000'

interface VerifyEmailProps {
  userName?: string
  userImage?: string
  verificationUrl: string
  requestIp?: string
  requestLocation?: string
}

export const VerifyEmail = ({
  userName,
  userImage,
  verificationUrl,
  requestIp,
  requestLocation,
}: VerifyEmailProps) => {
  const previewText = 'Verify your email address to activate your account'

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-gray-50 px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] bg-white p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/static/logo.png`}
                width="40"
                height="40"
                alt="Company Logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Verify your email address
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              {userName ? `Hello ${userName},` : 'Hello,'}
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              Thank you for registering. Please verify your email address to
              activate your account.
            </Text>
            {userImage && (
              <Section className="my-[24px] text-center">
                <Img
                  className="mx-auto rounded-full"
                  src={userImage}
                  width="64"
                  height="64"
                  alt={`${userName || 'User'}&apos;s profile picture`}
                />
              </Section>
            )}
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-blue-600 px-5 py-3 text-center text-[14px] font-semibold text-white no-underline transition-colors hover:bg-blue-700"
                href={verificationUrl}
              >
                Verify Email
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              or copy and paste this URL into your browser:{' '}
              <Link
                href={verificationUrl}
                className="text-blue-600 no-underline"
              >
                {verificationUrl}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              This verification was requested for
              {userName && <span className="text-black"> {userName}</span>}
              {requestIp && (
                <>
                  {' '}
                  from <span className="text-black">{requestIp}</span>
                </>
              )}
              {requestLocation && (
                <>
                  {' '}
                  located in{' '}
                  <span className="text-black">{requestLocation}</span>
                </>
              )}
              . If you did not request this, you can ignore this email. If you
              are concerned about your account&apos;s safety, please reply to
              this email to get in touch with us.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

VerifyEmail.PreviewProps = {
  userName: 'Ada Lovelace',
  userImage: `${baseUrl}/static/user.png`,
  verificationUrl: `${baseUrl}/verify?token=abc123`,
  requestIp: '192.168.1.1',
  requestLocation: 'London, UK',
} as VerifyEmailProps

export default VerifyEmail
