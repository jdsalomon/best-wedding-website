import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - Olive Branch */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M16 2c-1 0-2 1-2 2v6c0 0.5 0.2 1 0.6 1.4l8 8c0.8 0.8 2 0.8 2.8 0s0.8-2 0-2.8l-8-8C17 8.2 16.5 8 16 8V4c0-1-1-2-2-2z' fill='%23708238'/><ellipse cx='20' cy='8' rx='3' ry='1.5' fill='%236B7F2A'/><ellipse cx='18' cy='12' rx='2.5' ry='1.2' fill='%236B7F2A'/><ellipse cx='22' cy='11' rx='2' ry='1' fill='%236B7F2A'/><ellipse cx='15' cy='15' rx='2.5' ry='1.2' fill='%236B7F2A'/><ellipse cx='19' cy='16' rx='2' ry='1' fill='%236B7F2A'/><ellipse cx='24' cy='14' rx='1.8' ry='0.9' fill='%236B7F2A'/><ellipse cx='12' cy='18' rx='2' ry='1' fill='%236B7F2A'/><ellipse cx='16' cy='20' rx='1.8' ry='0.9' fill='%236B7F2A'/></svg>" />
        
        {/* Google Fonts - Merriweather + Lato */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Lato:wght@300;400;500;700&family=Inter:wght@300;400;500;600&display=swap"
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
          /* Placeholder text styling */
          ::placeholder {
            opacity: 0.4 !important;
          }
          ::-webkit-input-placeholder {
            opacity: 0.4 !important;
          }
          ::-moz-placeholder {
            opacity: 0.4 !important;
          }
          :-ms-input-placeholder {
            opacity: 0.4 !important;
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