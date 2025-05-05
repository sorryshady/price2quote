'use client'

import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'motion/react'

import { AppContainer } from '@/components/app-container'

const loadingPhrases = [
  'Brewing some code...',
  'Fetching digital dreams...',
  'Loading awesomeness...',
  'Generating magic...',
  'Almost there...',
]

export default function Loading() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % loadingPhrases.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <AppContainer>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative mb-4">
          <div className="flex items-center justify-center space-x-3">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="text-foreground text-4xl font-medium"
                animate={{
                  y: ['0%', '-50%', '0%'],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
                suppressHydrationWarning
              >
                •
              </motion.span>
            ))}
          </div>
          <motion.div
            className="bg-foreground absolute -bottom-4 left-1/2 h-1 w-16 origin-left -translate-x-1/2"
            animate={{
              scaleX: [0, 1],
              opacity: [0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            suppressHydrationWarning
          />
        </div>

        <div className="relative mt-8 h-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhraseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
              }}
              className="text-muted-foreground text-lg font-medium"
              suppressHydrationWarning
            >
              {loadingPhrases[currentPhraseIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppContainer>
  )
}
