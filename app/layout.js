import './globals.css'

export const metadata = {
  title: 'Mezbaan-e-Khaas - Your Special Mezbaan',
  description: 'Your Special Mezbaan — Hospitality with Heart. Experience authentic flavors and warm hospitality.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}