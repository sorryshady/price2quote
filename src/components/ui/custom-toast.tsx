import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react'
import { VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Card } from './card'

const toastVariants = cva(
  "p-4 min-w-[300px] max-w-[80vw] sm:max-w-[400px] rounded-md text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        success: 'bg-primary text-white',
        error: 'bg-red-400 text-white',
        warning: 'bg-yellow-400 text-white',
        info: 'bg-blue-400 text-white',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  },
)

interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

function CustomToast({ message, type }: ToastProps) {
  const icon = {
    success: <IconCheck className="size-5" />,
    error: <IconX className="size-5" />,
    warning: <IconAlertCircle className="size-5" />,
    info: <IconInfoCircle className="size-5" />,
  }
  return (
    <Card
      className={cn(
        toastVariants({ variant: type }),
        'flex flex-row items-center gap-4',
      )}
    >
      {icon[type]}
      {message}
    </Card>
  )
}

export { CustomToast }
