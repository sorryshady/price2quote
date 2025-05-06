import Link from 'next/link'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'

interface FormCardProps {
  heading: string
  subheading: string
  children: React.ReactNode
  backPrefix?: string
  backLabel?: string
  backHref?: string
}

const FormCard = ({
  heading,
  subheading,
  children,
  backPrefix,
  backLabel,
  backHref,
}: FormCardProps) => {
  return (
    <Card className="bg-background mx-auto w-full max-w-lg border border-zinc-200 shadow-lg dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl font-bold">
          {heading}
        </CardTitle>
        <CardDescription className="text-center text-zinc-500">
          {subheading}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-4">{children}</CardContent>
      <hr className="mx-6 my-2 border-zinc-200 dark:border-zinc-800" />
      <CardFooter className="flex items-center justify-between px-6 py-4">
        <div className="flex w-full items-center justify-end gap-2">
          {backPrefix && (
            <span className="text-sm text-zinc-500">{backPrefix}</span>
          )}
          {backLabel && backHref && (
            <Link
              href={backHref}
              className="text-primary focus:ring-primary rounded px-1 text-sm font-medium hover:underline focus:ring-2 focus:outline-none"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default FormCard
