import type { AppProps } from 'next/app'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  )
}