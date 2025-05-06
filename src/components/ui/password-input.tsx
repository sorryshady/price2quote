import * as React from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { Input } from './input'

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={`${className} pr-10`}
        autoComplete="new-password"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
