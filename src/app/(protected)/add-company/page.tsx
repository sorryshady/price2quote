import { OnboardingForm } from './_components/onboarding-form'

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome to PricingGPT</h1>
        <p className="text-muted-foreground">
          Let&apos;s set up your company profile to get started with AI-powered
          pricing
        </p>
      </div>

      <OnboardingForm />
    </div>
  )
}
