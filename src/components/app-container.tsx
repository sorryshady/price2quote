import React from 'react'

export const AppContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="container mx-auto p-8 pt-32">{children}</div>
}
