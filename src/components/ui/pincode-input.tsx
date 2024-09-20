'use client'

import { Button } from '@/components/ui/button'
import { Input, InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { forwardRef, useState } from 'react'

const PincodeInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [showPincode, setShowPincode] = useState(false)
    const disabled = props.disabled
    console.log(showPincode)
    return (
      <div className='relative'>
        <Input
          type={showPincode ? 'text' : 'password'}
          className={cn('hide-password-toggle pr-10', className)}
          ref={ref}
          {...props}
        />
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
          onClick={() => setShowPincode(prev => !prev)}
          disabled={disabled}>
          {showPincode && !disabled ? (
            <EyeIcon className='h-4 w-4' aria-hidden='true' />
          ) : (
            <EyeOffIcon className='h-4 w-4' aria-hidden='true' />
          )}
          <span className='sr-only'>
            {showPincode ? 'Hide password' : 'Show password'}
          </span>
        </Button>

        {/* hides browsers password toggles */}
        <style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
      </div>
    )
  },
)
PincodeInput.displayName = 'PasswordInput'

export { PincodeInput }
