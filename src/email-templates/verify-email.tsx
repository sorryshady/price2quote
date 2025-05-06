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

import logo from '/public/logo.png'

// NOTE: Set your base URL for images and assets used in emails
const baseUrl = env.NEXT_PUBLIC_API_URL
  ? env.NEXT_PUBLIC_API_URL
  : 'http://localhost:3000'

interface VerifyEmailProps {
  userName: string
  verificationUrl: string
  requestIp?: string
  requestLocation?: string
}

export const VerifyEmail = ({
  userName,
  verificationUrl,
  requestIp,
  requestLocation,
}: VerifyEmailProps) => {
  const previewText = 'Verify your email address to activate your account'

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-gray-100 px-2 py-8 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto max-w-[600px] rounded-2xl border border-solid border-[#eaeaea] bg-white p-0 shadow-lg">
            <Section className="flex flex-col items-center justify-center pt-8 pb-2">
              <Img
                src={logo.src}
                width="60"
                height="60"
                alt="Company Logo"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 mt-0 mb-2 p-0 text-center text-2xl font-bold tracking-tight text-gray-900">
              Verify your email address
            </Heading>
            <Section className="px-8 pb-2">
              <Text className="mb-1 text-center text-[15px] leading-[24px] text-gray-800">
                Hello {userName},
              </Text>
              <Text className="mb-4 text-center text-[15px] leading-[24px] text-gray-700">
                Thank you for registering. Please verify your email address to
                activate your account.
              </Text>
              <Section className="mt-4 mb-2 flex justify-center">
                <Button
                  className="rounded-full bg-blue-600 px-8 py-3 text-center text-[15px] font-semibold text-white no-underline shadow-md transition-colors hover:bg-blue-700"
                  href={verificationUrl}
                >
                  Verify Email
                </Button>
              </Section>
              <Text className="mb-4 text-center text-[14px] leading-[22px] text-gray-600">
                This link will expire in 15 minutes.
              </Text>
              <Text className="mb-2 text-center text-[13px] leading-[20px] text-gray-500">
                or copy and paste this URL into your browser:
              </Text>
              <Text className="mb-4 text-center text-[13px] leading-[20px] break-all text-blue-600">
                <Link
                  href={verificationUrl}
                  className="text-blue-600 no-underline"
                >
                  {verificationUrl}
                </Link>
              </Text>
              <Hr className="mx-0 my-6 w-full border border-solid border-[#eaeaea]" />
              <Text className="mb-2 text-center text-[12px] leading-[20px] text-gray-400">
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
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

VerifyEmail.PreviewProps = {
  userName: 'Ada Lovelace',
  verificationUrl: `${baseUrl}/verify?token=abc123`,
  requestIp: '192.168.1.1',
  requestLocation: 'London, UK',
} as VerifyEmailProps

export default VerifyEmail
