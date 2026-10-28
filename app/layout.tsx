import type { Metadata } from 'voter' // atau sesuaikan import type Next Anda
import './globals.css'

export const metadata: Metadata = {
  title: 'Rangga Kurnia Sandhi — S.Kom. | IT Support & Software Engineer',
  description: 'Portofolio profesional Rangga Kurnia Sandhi, S.Kom. — Sarjana Teknik Informatika yang berfokus pada IT Support, Infrastruktur, dan Pengembangan Perangkat Lunak.',
  keywords: ['Rangga Kurnia Sandhi', 'IT Support', 'Software Engineer', 'Portofolio IT', 'Teknik Informatika'],
  authors: [{ name: 'Rangga Kurnia Sandhi' }],
  openGraph: {
    title: 'Rangga Kurnia Sandhi — IT Support & Software Engineer',
    description: 'Jelajahi rekam jejak, publikasi ilmiah, dan proyek lintas platform (Desktop, Android, Web) karya Rangga Kurnia Sandhi.',
    url: 'https://portoranggakurnia.com', // Ubah nanti setelah domain aktif
    siteName: 'Rangga Kurnia Sandhi Portfolio',
    images: [
      {
        url: '/og-image.jpg', // Pastikan file gambar ada di folder public
        width: 1200,
        height: 630,
        alt: 'Rangga Kurnia Sandhi Portfolio Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rangga Kurnia Sandhi — IT Support & Software Engineer',
    description: 'Portofolio profesional IT Support & Software Engineer.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="bg-white text-[#202A3A] antialiased">
        {children}
      </body>
    </html>
  )
}