import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts - Merriweather + Lato */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Lato:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
        {/* CSS Reset */}
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}