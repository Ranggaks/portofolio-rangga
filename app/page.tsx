'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Home() {
  const [images, setImages] = useState<Record<string, string>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // State untuk menampung array foto multi-slide per proyek
  const [projectSlides, setProjectSlides] = useState({
    desktop_app: [] as string[],
    mobile_app: [] as string[],
    web_app: [] as string[],
  })

  // Index slide aktif untuk masing-masing proyek di halaman utama
  const [activeSlide, setActiveSlide] = useState({
    desktop_app: 0,
    mobile_app: 0,
    web_app: 0,
  })

  // State untuk Lightbox (Modal Zoom Gambar & Navigasi Slide dalam Modal)
  const [lightboxData, setLightboxData] = useState<{
    images: string[]
    currentIndex: number
  } | null>(null)

  // Mengambil data gambar dari Supabase secara asinkron di Client side
  useEffect(() => {
    async function fetchImages() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) return

      const supabase = createClient(url, key)
      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('id, image_url')
        .order('id', { ascending: true })

      if (!error && data) {
        const imgMap: Record<string, string> = {}
        const slidesMap = {
          desktop_app: [] as string[],
          mobile_app: [] as string[],
          web_app: [] as string[],
        }

        data.forEach((item) => {
          if (item.image_url) {
            imgMap[item.id] = item.image_url
            const urls = item.image_url.split(',').map((u: string) => u.trim()).filter(Boolean)
            if (item.id === 'desktop_app') slidesMap.desktop_app = urls
            if (item.id === 'mobile_app') slidesMap.mobile_app = urls
            if (item.id === 'web_app') slidesMap.web_app = urls
          }
        })

        setImages(imgMap)
        setProjectSlides(slidesMap)
      }
    }

    fetchImages()
  }, [])

  // Efek Auto-Slide otomatis setiap 4 detik untuk setiap galeri proyek (jika lightbox tidak aktif)
  useEffect(() => {
    if (lightboxData) return

    const interval = setInterval(() => {
      setActiveSlide((prev) => ({
        desktop_app: projectSlides.desktop_app.length > 1 ? (prev.desktop_app + 1) % projectSlides.desktop_app.length : 0,
        mobile_app: projectSlides.mobile_app.length > 1 ? (prev.mobile_app + 1) % projectSlides.mobile_app.length : 0,
        web_app: projectSlides.web_app.length > 1 ? (prev.web_app + 1) % projectSlides.web_app.length : 0,
      }))
    }, 4000)

    return () => clearInterval(interval)
  }, [projectSlides, lightboxData])

  // Efek Navigasi Keyboard (Panah Kiri/Kanan untuk Slide, Tombol Esc untuk Menutup Lightbox)
  useEffect(() => {
    if (!lightboxData) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLightboxData(prev => prev ? {
          ...prev,
          currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
        } : null)
      } else if (e.key === 'ArrowRight') {
        setLightboxData(prev => prev ? {
          ...prev,
          currentIndex: (prev.currentIndex + 1) % prev.images.length
        } : null)
      } else if (e.key === 'Escape') {
        setLightboxData(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxData])

  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#202A3A] font-sans antialiased selection:bg-[#263B63] selection:text-white relative overflow-hidden pt-14 sm:pt-16">
      
      {/* Background Ambient Glow & Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-[#EDF2FA] via-transparent to-transparent pointer-events-none -z-10 blur-3xl"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#202A3A05_1px,transparent_1px),linear-gradient(to_bottom,#202A3A05_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:32px_32px] pointer-events-none -z-10"></div>

      {/* ================= LIGHTBOX MODAL DENGAN KLIK LUAR & NAVIGASI ================= */}
      {lightboxData && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxData(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center pt-8" onClick={(e) => e.stopPropagation()}>
            
            {/* Tombol Tutup */}
            <button
              onClick={() => setLightboxData(null)}
              className="absolute top-0 right-0 px-4 py-2 bg-white/10 hover:bg-white/25 text-white rounded-xl text-xs font-mono font-semibold transition-all border border-white/20 flex items-center gap-2 cursor-pointer z-20"
            >
              <span>Tutup X</span>
            </button>

            {/* Container Gambar & Panah Navigasi */}
            <div className="relative w-full max-h-[85vh] flex items-center justify-center">
              
              {lightboxData.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxData(prev => prev ? {
                      ...prev,
                      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
                    } : null)
                  }}
                  className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all border border-white/20 cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              <div 
                className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2 sm:p-4 max-w-full max-h-[85vh] flex items-center justify-center cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={lightboxData.images[lightboxData.currentIndex]} 
                  alt="Enlarged Screenshot" 
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>

              {lightboxData.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxData(prev => prev ? {
                      ...prev,
                      currentIndex: (prev.currentIndex + 1) % prev.images.length
                    } : null)
                  }}
                  className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all border border-white/20 cursor-pointer"
                  aria-label="Next Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

            </div>

            {lightboxData.images.length > 1 && (
              <div className="mt-4 text-white/80 text-xs font-mono bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {lightboxData.currentIndex + 1} / {lightboxData.images.length}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= STICKY HEADER & MOBILE NAV BAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EDF2FA] px-4 sm:px-8 md:px-16 py-3 shadow-2xs transition-all">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="#" className="font-bold text-xs sm:text-sm tracking-tight text-[#202A3A] flex items-center gap-2 group truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#263B63] shrink-0 group-hover:scale-125 transition-transform shadow-md shadow-[#263B63]/30"></span>
            <span className="truncate">Rangga Kurnia Sandhi</span>
            <span className="hidden xs:inline-block text-[10px] font-mono text-[#263B63] bg-[#EDF2FA] border border-[#EDF2FA] px-1.5 py-0.5 rounded font-semibold">S.Kom.</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide text-[#202A3A]/70 uppercase">
            <a href="#about" className="hover:text-[#263B63] transition-colors">About</a>
            <a href="#publication" className="hover:text-[#263B63] transition-colors">Publication</a>
            <a href="#experience" className="hover:text-[#263B63] transition-colors">Experience</a>
            <a href="#skills" className="hover:text-[#263B63] transition-colors">Skills</a>
            <a href="#projects" className="hover:text-[#263B63] transition-colors">Projects</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#contact"
              className="hidden sm:inline-block px-3.5 py-2 rounded-xl bg-[#263B63] text-white text-[11px] sm:text-xs font-medium hover:bg-[#202A3A] transition-all shadow-sm"
            >
              Contact
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[#EDF2FA] text-[#263B63] focus:outline-none flex items-center justify-center hover:bg-[#EDF2FA]/80 transition-colors"
              aria-label="Toggle Menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-[#EDF2FA] shadow-xl py-3 px-6 flex flex-col gap-2.5 text-xs font-semibold tracking-wide text-[#202A3A]/80 uppercase transition-all">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#EDF2FA]/60 hover:text-[#263B63] transition-colors">About</a>
            <a href="#publication" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#EDF2FA]/60 hover:text-[#263B63] transition-colors">Publication</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#EDF2FA]/60 hover:text-[#263B63] transition-colors">Experience</a>
            <a href="#skills" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#EDF2FA]/60 hover:text-[#263B63] transition-colors">Skills</a>
            <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#EDF2FA]/60 hover:text-[#263B63] transition-colors">Projects</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#263B63] font-bold flex items-center justify-between">
              <span>Contact</span>
              <span>→</span>
            </a>
          </div>
        )}
      </header>

      {/* ================= HERO & ABOUT SECTION ================= */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pt-14 sm:pb-16 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center">
          
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-[260px] sm:max-w-[310px] aspect-[4/5] rounded-[2rem] bg-white border border-[#202A3A]/10 p-2 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-hidden">
              <div className="w-full h-full rounded-[1.5rem] bg-[#EDF2FA] overflow-hidden relative flex items-center justify-center">
                {images.profile ? (
                  <img 
                    src={images.profile} 
                    alt="Rangga Kurnia Sandhi" 
                    className="w-full h-full object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#263B63] text-white flex items-center justify-center font-bold text-2xl mb-3 shadow-md">
                      RKS
                    </div>
                    <span className="text-[11px] font-mono text-[#263B63] font-semibold mb-1 px-3 py-0.5 bg-white border border-[#EDF2FA] rounded-full">Area Foto Profil</span>
                    <p className="text-sm font-bold text-[#202A3A] mt-2">Rangga Kurnia Sandhi, S.Kom.</p>
                    <p className="text-xs text-[#202A3A]/70 mt-0.5">IT Support & Software Engineer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#202A3A] leading-[1.08]">
              Rangga Kurnia Sandhi
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-[#202A3A]/80 leading-relaxed font-normal text-justify">
              Sarjana Teknik Informatika dengan rekam jejak profesional dalam bidang dukungan teknologi informasi, pemeliharaan sistem, serta pengembangan perangkat lunak yang andal, efisien, dan berorientasi pada solusi.
            </p>

            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-[#EDF2FA]/90 to-white/60 backdrop-blur-md border border-[#EDF2FA] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-4 sm:my-6 text-left">
              <div className="border-b sm:border-b-0 sm:border-r border-[#202A3A]/10 pb-2.5 sm:pb-0 sm:pr-4">
                <span className="text-[10px] sm:text-[11px] font-mono text-[#202A3A]/60 uppercase tracking-wider block font-semibold">Program Studi</span>
                <span className="text-xs sm:text-sm font-bold text-[#202A3A] mt-0.5 block">S1 Teknik Informatika</span>
              </div>
              <div className="border-b sm:border-b-0 sm:border-r border-[#202A3A]/10 pb-2.5 sm:pb-0 sm:pr-4">
                <span className="text-[10px] sm:text-[11px] font-mono text-[#202A3A]/60 uppercase tracking-wider block font-semibold">Indeks Prestasi (IPK)</span>
                <span className="text-xs sm:text-sm font-bold text-[#263B63] mt-0.5 block flex items-center gap-1.5">
                  3.76 <span className="text-[10px] font-normal text-[#202A3A]/60">/ 4.00</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#202A3A]/60 uppercase tracking-wider block font-semibold">Universitas</span>
                <span className="text-xs sm:text-sm font-bold text-[#202A3A] mt-0.5 block">Indraprasta PGRI</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start items-center">
              <a href="#projects" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#263B63] text-white text-xs sm:text-sm font-semibold hover:bg-[#202A3A] transition-all shadow-md flex items-center justify-center gap-2 group">
                <span>View Featured Projects</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a 
                href="/CV_Rangga_Kurnia_Sandhi.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#EDF2FA] bg-[#EDF2FA] text-[#202A3A] text-xs sm:text-sm font-semibold hover:bg-white hover:border-[#263B63]/40 transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                <span>Lihat CV PDF</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ================= ACADEMIC PUBLICATION ================= */}
      <section id="publication" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="mb-8 sm:mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Scholarly Contribution</span>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
            Academic Publication & Research
          </h2>
        </div>

        <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-6 sm:p-10 transition-all hover:border-[#263B63]/40 hover:shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3">
            <div>
              <span className="text-[11px] font-mono text-[#263B63] font-bold tracking-wider uppercase">Jurnal Mahasiswa • Teknobis</span>
              <h3 className="text-lg sm:text-xl font-bold text-[#202A3A] mt-1 leading-snug">Pelanggaran Etika Profesi di Bidang Teknologi Informasi pada Kasus Kebocoran Data BPJS Kesehatan</h3>
            </div>
            <a href="https://jurnalmahasiswa.com/index.php/teknobis/article/view/3026" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#263B63] text-white text-xs font-mono font-semibold hover:bg-[#202A3A] transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0">
              <span>Baca Jurnal ↗</span>
            </a>
          </div>
          <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed mt-3 text-justify">
            Artikel ilmiah yang menganalisis aspek etika profesi teknologi informasi, regulasi perlindungan data pribadi, serta akar permasalahan teknis maupun struktural dalam insiden kebocoran data sistem BPJS Kesehatan di Indonesia.
          </p>
          <div className="mt-5 pt-3 border-t border-[#202A3A]/10 flex flex-wrap gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/70">
            <span className="font-semibold text-[#202A3A] self-center">Keywords:</span> 
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Etika Profesi IT</span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Kebocoran Data</span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Keamanan Informasi</span>
          </div>
        </div>
      </section>

      {/* ================= EXPERIENCE ================= */}
      <section id="experience" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Track Record</span>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
              Professional Experience
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs font-mono text-[#202A3A]/60">PENGALAMAN MAGANG & SISTEM</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-[#EDF2FA] p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] hover:border-[#263B63]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 sm:mb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#263B63] font-bold uppercase tracking-wider">Software Engineer Intern</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#202A3A] mt-0.5 group-hover:text-[#263B63] transition-colors">PT Tampian Kencana Sejati</h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white border border-[#EDF2FA] rounded-lg sm:rounded-xl text-[#263B63] font-semibold">Apr - Jul 2026</span>
              </div>
              <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed mt-3 text-justify">
                Merancang aplikasi sistem pakar berbasis mobile untuk mendigitalisasi proses diagnosis kerusakan armada kendaraan guna mempercepat pemeliharaan berkala.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#202A3A]/10 text-[11px] sm:text-xs font-mono text-[#202A3A]/70">
              <span className="font-semibold text-[#202A3A]">Tech:</span> Kotlin, Android Studio, MySQL, REST API, Forward Chaining
            </div>
          </div>

          <div className="bg-[#EDF2FA] p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] hover:border-[#263B63]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 sm:mb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#202A3A]/70 font-bold uppercase tracking-wider">Software Engineer Intern</span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#202A3A] mt-0.5 group-hover:text-[#263B63] transition-colors">MI Al-Hikmah Jakarta</h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white border border-[#EDF2FA] rounded-lg sm:rounded-xl text-[#202A3A]/80 font-semibold">Okt - Des 2025</span>
              </div>
              <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed mt-3 text-justify">
                Merancang dan membangun aplikasi desktop sistem administrasi keuangan sekolah untuk mendigitalisasi pencatatan transaksi pembayaran siswa serta meminimalkan risiko kesalahan entri data.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-[#202A3A]/10 text-[11px] sm:text-xs font-mono text-[#202A3A]/70">
              <span className="font-semibold text-[#202A3A]">Tech:</span> Java, NetBeans IDE, MySQL, JasperReports
            </div>
          </div>
        </div>
      </section>

      {/* ================= SKILLS & INFRASTRUCTURE (DIKEMBALIKAN KE 3 KOTAK UTAMA) ================= */}
      <section id="skills" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="mb-8 sm:mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Technical Stack</span>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
            Skills & Infrastructure
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Kotak 1: Programming Languages */}
          <div className="bg-[#EDF2FA] p-6 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] shadow-2xs hover:border-[#263B63]/40 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202A3A] mb-3 pb-2 border-b border-[#202A3A]/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#263B63]"></span>
                Programming Languages
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80 pt-1">
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">Java</span>
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">Kotlin</span>
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">PHP</span>
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">HTML</span>
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">SQL</span>
                <span className="px-3 py-1.5 bg-white rounded-lg border border-[#EDF2FA] font-semibold">JavaScript</span>
              </div>
            </div>
          </div>

          {/* Kotak 2: Frameworks & Tools */}
          <div className="bg-[#EDF2FA] p-6 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] shadow-2xs hover:border-[#263B63]/40 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202A3A] mb-3 pb-2 border-b border-[#202A3A]/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#263B63]"></span>
                Frameworks & Tools
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80 pt-1">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Android Studio</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">NetBeans</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">VS Code</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Next.js</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Tailwind CSS</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Git / GitHub</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Postman</span>
              </div>
            </div>
          </div>

          {/* Kotak 3: Database & IT Support */}
          <div className="bg-[#EDF2FA] p-6 sm:p-7 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] shadow-2xs hover:border-[#263B63]/40 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#202A3A] mb-3 pb-2 border-b border-[#202A3A]/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#263B63]"></span>
                Database & IT Support
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80 pt-1">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">MySQL / SQLite</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Supabase</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">XAMPP</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">JasperReports</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">LAN / Networking</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA] font-medium">Troubleshooting</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= PROJECTS SHOWCASE ================= */}
      <section id="projects" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="mb-10 sm:mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Portfolio Showcase</span>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
            Featured Projects
          </h2>
          <p className="text-xs sm:text-sm text-[#202A3A]/70 mt-1">Showcase 3 Pilar Proyek Utama Lintas Platform (Desktop, Android, & Web Full-Stack).</p>
        </div>

        <div className="space-y-12 sm:space-y-20">
          
          {/* PROYEK 1: DESKTOP (Landscape dengan Bingkai Jendela Profesional) */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border border-[#202A3A]/15 overflow-hidden shadow-md relative group">
                <div className="px-4 py-2.5 bg-[#EDF2FA] border-b border-[#EDF2FA] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-[10px] font-mono text-[#263B63] font-bold">JAVA DESKTOP APP</span>
                </div>
                <div 
                  className="w-full aspect-[16/10] relative flex items-center justify-center bg-slate-50 overflow-hidden cursor-zoom-in"
                  onClick={() => {
                    if (projectSlides.desktop_app.length > 0) {
                      setLightboxData({
                        images: projectSlides.desktop_app,
                        currentIndex: activeSlide.desktop_app
                      })
                    }
                  }}
                  title="Klik untuk memperbesar gambar"
                >
                  {projectSlides.desktop_app.length > 0 && projectSlides.desktop_app[activeSlide.desktop_app] ? (
                    <>
                      <img 
                        src={projectSlides.desktop_app[activeSlide.desktop_app]} 
                        alt="Desktop App Screenshot" 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102" 
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Klik untuk memperbesar
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <span className="text-xs font-mono text-[#202A3A]/60 block mb-1 font-semibold">Area Screenshot Desktop App</span>
                      <p className="text-xs text-[#202A3A]/70">Antarmuka Keuangan NetBeans & JasperReports</p>
                    </div>
                  )}
                  {projectSlides.desktop_app.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                      {projectSlides.desktop_app.map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveSlide(prev => ({ ...prev, desktop_app: idx }))}
                          className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeSlide.desktop_app === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                        ></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#263B63] font-bold tracking-wider uppercase">Desktop Enterprise</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A] mt-1 sm:mt-2">Sistem Administrasi Keuangan Sekolah</h3>
                  <p className="text-xs sm:text-sm text-[#202A3A]/80 mt-3 sm:mt-4 leading-relaxed text-justify">
                    Aplikasi manajemen transaksi pembayaran siswa dan operasional sekolah dengan hak akses terotentikasi serta modul cetak laporan keuangan resmi berbasis JasperReports.
                  </p>
                </div>
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#202A3A]/10">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80">
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Java</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">NetBeans</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">MySQL</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">JasperReports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROYEK 2: ANDROID MOBILE (Potret dengan ukuran presisi & bingkai perangkat selaras) */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              <div className="lg:col-span-5 flex flex-col justify-between order-2 lg:order-1">
                <div>
                  <span className="text-[11px] font-mono text-[#263B63] font-bold tracking-wider uppercase">02. Android Mobile</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A] mt-1 sm:mt-2">Sistem Pakar Diagnosa Kerusakan Bus</h3>
                  <p className="text-xs sm:text-sm text-[#202A3A]/80 mt-3 sm:mt-4 leading-relaxed text-justify">
                    Aplikasi Android diagnostik armada bus berbasis Forward Chaining. Membantu teknisi lapangan mengidentifikasi gejala kerusakan secara cepat dan presisi melalui REST API.
                  </p>
                </div>
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#202A3A]/10">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80">
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Kotlin</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Android Studio</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Forward Chaining</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">REST API</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex justify-center order-1 lg:order-2">
                <div className="w-full max-w-[240px] sm:max-w-[270px] bg-white rounded-[2.2rem] border-[5px] border-[#202A3A]/15 overflow-hidden shadow-md relative group">
                  <div className="px-3 py-2 bg-[#EDF2FA] border-b border-[#EDF2FA] flex items-center justify-center">
                    <div className="w-12 h-1 bg-[#202A3A]/20 rounded-full"></div>
                  </div>
                  <div 
                    className="w-full aspect-[9/16] relative flex items-center justify-center bg-slate-50 overflow-hidden cursor-zoom-in"
                    onClick={() => {
                      if (projectSlides.mobile_app.length > 0) {
                        setLightboxData({
                          images: projectSlides.mobile_app,
                          currentIndex: activeSlide.mobile_app
                        })
                      }
                    }}
                    title="Klik untuk memperbesar gambar"
                  >
                    {projectSlides.mobile_app.length > 0 && projectSlides.mobile_app[activeSlide.mobile_app] ? (
                      <>
                        <img 
                          src={projectSlides.mobile_app[activeSlide.mobile_app]} 
                          alt="Mobile App Screenshot" 
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102 p-1" 
                        />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Klik untuk memperbesar
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <span className="text-xs font-mono text-[#202A3A]/60 block mb-1 font-semibold">Area Screenshot Mobile App</span>
                        <p className="text-xs text-[#202A3A]/70">Antarmuka Diagnosa Kerusakan</p>
                      </div>
                    )}
                    {projectSlides.mobile_app.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                        {projectSlides.mobile_app.map((_, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setActiveSlide(prev => ({ ...prev, mobile_app: idx }))}
                            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeSlide.mobile_app === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                          ></button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PROYEK 3: WEB PLATFORM (Landscape dengan Bingkai Jendela Profesional) */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border border-[#202A3A]/15 overflow-hidden shadow-md relative group">
                <div className="px-4 py-2.5 bg-[#EDF2FA] border-b border-[#EDF2FA] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-[10px] font-mono text-[#263B63] font-bold">FULL-STACK WEB PLATFORM</span>
                </div>
                <div 
                  className="w-full aspect-[16/10] relative flex items-center justify-center bg-slate-50 overflow-hidden cursor-zoom-in"
                  onClick={() => {
                    if (projectSlides.web_app.length > 0) {
                      setLightboxData({
                        images: projectSlides.web_app,
                        currentIndex: activeSlide.web_app
                      })
                    }
                  }}
                  title="Klik untuk memperbesar gambar"
                >
                  {projectSlides.web_app.length > 0 && projectSlides.web_app[activeSlide.web_app] ? (
                    <>
                      <img 
                        src={projectSlides.web_app[activeSlide.web_app]} 
                        alt="Web App Screenshot" 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102" 
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Klik untuk memperbesar
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <span className="text-xs font-mono text-[#202A3A]/60 block mb-1 font-semibold">Area Screenshot Website</span>
                      <p className="text-xs text-[#202A3A]/70">Galeri Interaktif & Panel Admin Supabase</p>
                    </div>
                  )}
                  {projectSlides.web_app.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                      {projectSlides.web_app.map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveSlide(prev => ({ ...prev, web_app: idx }))}
                          className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${activeSlide.web_app === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                        ></button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <span className="text-[11px] font-mono text-[#263B63] font-bold tracking-wider uppercase">03. Web Platform</span>
                    <a href="https://yrlooksphotography.vercel.app" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-[#263B63] text-white text-xs font-mono font-semibold hover:bg-[#202A3A] transition-all shadow-sm flex items-center justify-center gap-1.5 w-fit">
                      <span>Lihat Website</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A] mt-1 sm:mt-2">YRLOOKS Photography Platform</h3>
                  <p className="text-xs sm:text-sm text-[#202A3A]/80 mt-3 sm:mt-4 leading-relaxed text-justify">
                    Website portofolio fotografi full-stack dengan galeri interaktif berfitur filter & lightbox, sistem reservasi daring berbasis cloud, serta panel admin terproteksi untuk manajemen pesanan.
                  </p>
                </div>
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#202A3A]/10">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-[#202A3A]/80">
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Next.js</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Supabase</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Tailwind CSS</span>
                    <span className="px-2.5 py-1 bg-white rounded-lg sm:rounded-xl font-medium border border-[#EDF2FA]">Vercel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FOOTER & CONTACT ================= */}
      <footer id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="bg-[#EDF2FA] text-[#202A3A] rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 border border-[#EDF2FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 relative overflow-hidden">
          
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#263B63]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] sm:text-xs font-semibold text-[#263B63] bg-white rounded-full border border-[#EDF2FA] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#263B63] animate-pulse"></span>
              GET IN TOUCH
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#202A3A]">Mari Berkolaborasi</h2>
            <p className="text-xs sm:text-sm text-[#202A3A]/80 mt-2 leading-relaxed text-justify">
              Terbuka untuk posisi IT Support Specialist, Technical Support, maupun Software Engineer. Mari diskusikan peluang kerja sama bersama Anda.
            </p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto">
            <a href="mailto:ranggakurnia222@gmail.com" className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#263B63] text-white text-xs font-mono font-bold hover:bg-[#202A3A] transition-all text-center shadow-md flex items-center justify-center gap-2">
              <span className="truncate">ranggakurnia222@gmail.com</span>
              <span>→</span>
            </a>
          </div>

        </div>
        
        <div className="mt-8 sm:mt-12 text-center text-xs text-[#202A3A]/60">
          <p>© 2026 Rangga Kurnia Sandhi. All rights reserved.</p>
        </div>
      </footer>

    </main>
  )
}