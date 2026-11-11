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

      {/* ================= LIGHTBOX MODAL ================= */}
      {lightboxData && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxData(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center pt-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxData(null)}
              className="absolute top-0 right-0 px-4 py-2 bg-white/10 hover:bg-white/25 text-white rounded-xl text-xs font-mono font-semibold transition-all border border-white/20 flex items-center gap-2 cursor-pointer z-20"
            >
              <span>Tutup X</span>
            </button>

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

      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EDF2FA] px-4 sm:px-8 md:px-16 py-3 shadow-2xs transition-all">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="#" className="font-bold text-xs sm:text-sm tracking-tight text-[#202A3A] flex items-center gap-2 group truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#263B63] shrink-0 group-hover:scale-125 transition-transform shadow-md shadow-[#263B63]/30"></span>
            <span className="truncate">Rangga Kurnia Sandhi</span>
            <span className="hidden xs:inline-block text-[10px] font-mono text-[#263B63] bg-[#EDF2FA] border border-[#EDF2FA] px-1.5 py-0.5 rounded font-semibold">S.Kom.</span>
          </a>

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
                  <div className="w-full h-full flex items-center justify-center bg-[#EDF2FA] animate-pulse">
                    <span className="text-xs font-mono text-[#202A3A]/40">Loading...</span>
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

      {/* ================= EXPERIENCE (Urutan: 1. Jabatan & Tahun, 2. Tempat) ================= */}
      <section id="experience" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="mb-10 sm:mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Track Record</span>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
            Professional Experience
          </h2>
        </div>

        <div className="relative border-l-2 border-[#263B63]/20 ml-3 sm:ml-6 space-y-10">
          
          {/* Pengalaman 1 */}
          <div className="relative pl-6 sm:pl-8 group">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#263B63] border-4 border-white shadow-md group-hover:scale-125 transition-transform"></div>
            
            <div className="bg-[#EDF2FA] p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] hover:border-[#263B63]/40 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-2">
                <span className="text-sm sm:text-base font-bold text-[#263B63] uppercase tracking-wider">IT Support</span>
                <span className="text-[11px] font-mono px-3 py-1 bg-white border border-[#EDF2FA] rounded-xl text-[#202A3A] font-semibold shadow-2xs self-start sm:self-auto">Nov 2026 - Saat ini</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#202A3A]/90 mb-3">RS Anak dan Bunda Harapan Kita Jakarta</h3>
              <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                Bertugas menginstalasi, memelihara, dan memperbaiki infrastruktur perangkat keras, jaringan, serta perangkat medis berbasis IT guna memastikan seluruh operasional pelayanan kesehatan SIMRS berjalan 24/7 tanpa gangguan.
              </p>
              <div className="mt-5 pt-3 border-t border-[#202A3A]/10 text-[11px] sm:text-xs font-mono text-[#202A3A]/70 flex flex-wrap gap-2">
                <span className="font-semibold text-[#202A3A] self-center">Skills:</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">SIMRS Infrastructure</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Hardware</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Network Troubleshooting</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Pengalaman 2 */}
          <div className="relative pl-6 sm:pl-8 group">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#263B63]/60 border-4 border-white shadow-md group-hover:scale-125 transition-transform"></div>
            
            <div className="bg-[#EDF2FA] p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] hover:border-[#263B63]/40 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-2">
                <span className="text-sm sm:text-base font-bold text-[#263B63] uppercase tracking-wider">Software Engineer Intern</span>
                <span className="text-[11px] font-mono px-3 py-1 bg-white border border-[#EDF2FA] rounded-xl text-[#202A3A] font-semibold shadow-2xs self-start sm:self-auto">Apr 2026 - Jul 2026</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#202A3A]/90 mb-3">PT Tampian Kencana Sejati</h3>
              <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                Merancang aplikasi sistem pakar berbasis mobile untuk mendigitalisasi proses diagnosis kerusakan armada kendaraan guna mempercepat pemeliharaan berkala.
              </p>
              <div className="mt-5 pt-3 border-t border-[#202A3A]/10 text-[11px] sm:text-xs font-mono text-[#202A3A]/70 flex flex-wrap gap-2">
                <span className="font-semibold text-[#202A3A] self-center">Tech:</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Kotlin</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Android Studio</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">MySQL</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">REST API</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Forward Chaining</span>
              </div>
            </div>
          </div>

          {/* Pengalaman 3 */}
          <div className="relative pl-6 sm:pl-8 group">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#202A3A]/40 border-4 border-white shadow-md group-hover:scale-125 transition-transform"></div>
            
            <div className="bg-[#EDF2FA] p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#EDF2FA] hover:border-[#263B63]/40 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-2">
                <span className="text-sm sm:text-base font-bold text-[#202A3A]/80 uppercase tracking-wider">Software Engineer Intern</span>
                <span className="text-[11px] font-mono px-3 py-1 bg-white border border-[#EDF2FA] rounded-lg text-[#202A3A]/80 font-semibold shadow-2xs self-start sm:self-auto">Okt 2025 - Des 2025</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#202A3A]/90 mb-3">MI Al-Hikmah Jakarta</h3>
              <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                Merancang dan membangun aplikasi desktop sistem administrasi keuangan sekolah untuk mendigitalisasi pencatatan transaksi pembayaran siswa serta meminimalkan risiko kesalahan entri data.
              </p>
              <div className="mt-5 pt-3 border-t border-[#202A3A]/10 text-[11px] sm:text-xs font-mono text-[#202A3A]/70 flex flex-wrap gap-2">
                <span className="font-semibold text-[#202A3A] self-center">Tech:</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">Java</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">NetBeans IDE</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">MySQL</span>
                <span className="px-2 py-0.5 bg-white rounded border border-[#EDF2FA]">JasperReports</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= SKILLS & INFRASTRUCTURE ================= */}
      <section id="skills" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="mb-8 sm:mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Technical Stack</span>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#202A3A] mt-0.5 sm:mt-1">
            Skills & Infrastructure
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
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
          
          {/* PROYEK 1: DESKTOP */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#263B63] text-white text-[10px] font-mono font-bold uppercase">Desktop App</span>
                  <span className="text-xs font-mono text-[#202A3A]/60">Sistem Keuangan Sekolah</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A]">Aplikasi Administrasi Keuangan MI Al-Hikmah</h3>
                <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                  Sistem informasi desktop yang dirancang untuk mendigitalisasi pencatatan pembayaran SPP dan administrasi siswa secara aman, terpusat, dan dilengkapi fitur cetak laporan otomatis berbasis JasperReports.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-[#202A3A]/70">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Java</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">NetBeans</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">MySQL</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">JasperReports</span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-white border border-[#202A3A]/10 p-2 shadow-md overflow-hidden group">
                  <div className="rounded-xl bg-[#EDF2FA] overflow-hidden relative aspect-[16/10] flex items-center justify-center">
                    {projectSlides.desktop_app.length > 0 ? (
                      <div className="w-full h-full relative cursor-pointer" onClick={() => setLightboxData({ images: projectSlides.desktop_app, currentIndex: activeSlide.desktop_app })}>
                        <img 
                          src={projectSlides.desktop_app[activeSlide.desktop_app] || projectSlides.desktop_app[0]} 
                          alt="Desktop App Preview" 
                          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono rounded-md">
                          {activeSlide.desktop_app + 1} / {projectSlides.desktop_app.length} (Klik Zoom)
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#202A3A]/50">Screenshot Desktop App</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PROYEK 2: MOBILE */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
              
              <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
                <div className="w-full max-w-[240px] rounded-3xl bg-white border border-[#202A3A]/10 p-2 shadow-md overflow-hidden">
                  <div className="rounded-2xl bg-[#EDF2FA] overflow-hidden relative aspect-[9/16] flex items-center justify-center">
                    {projectSlides.mobile_app.length > 0 ? (
                      <div className="w-full h-full relative cursor-pointer" onClick={() => setLightboxData({ images: projectSlides.mobile_app, currentIndex: activeSlide.mobile_app })}>
                        <img 
                          src={projectSlides.mobile_app[activeSlide.mobile_app] || projectSlides.mobile_app[0]} 
                          alt="Mobile App Preview" 
                          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono rounded-md">
                          {activeSlide.mobile_app + 1} / {projectSlides.mobile_app.length} (Klik Zoom)
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#202A3A]/50">Screenshot Mobile App</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#263B63] text-white text-[10px] font-mono font-bold uppercase">Android App</span>
                  <span className="text-xs font-mono text-[#202A3A]/60">Sistem Pakar Kendaraan</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A]">Aplikasi Mobile Expert System Diagnosis Bus</h3>
                <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                  Aplikasi Android berbasis metode Forward Chaining untuk membantu mekanik dan pengemudi mendiagnosis gejala kerusakan armada bus secara cepat melalui antarmuka seluler yang interaktif.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-[#202A3A]/70">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Kotlin</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Android Studio</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">MySQL REST API</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Forward Chaining</span>
                </div>
              </div>

            </div>
          </div>

          {/* PROYEK 3: WEB */}
          <div className="bg-[#EDF2FA] rounded-2xl sm:rounded-[2.5rem] border border-[#EDF2FA] p-5 sm:p-10 transition-all duration-300 hover:shadow-xl hover:border-[#263B63]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#263B63] text-white text-[10px] font-mono font-bold uppercase">Web Full-Stack</span>
                  <span className="text-xs font-mono text-[#202A3A]/60">Photography Portfolio & Booking</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#202A3A]">Web YRLOOKS Photography Portfolio</h3>
                <p className="text-xs sm:text-sm text-[#202A3A]/80 leading-relaxed text-justify">
                  Platform web fotografi profesional dengan galeri interaktif, sistem reservasi/booking otomatis berbasis cloud, serta panel admin privat untuk mengelola portofolio secara real-time.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-[#202A3A]/70">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Next.js</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">React</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Tailwind CSS</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-[#EDF2FA]">Supabase</span>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-white border border-[#202A3A]/10 p-2 shadow-md overflow-hidden group">
                  <div className="rounded-xl bg-[#EDF2FA] overflow-hidden relative aspect-[16/10] flex items-center justify-center">
                    {projectSlides.web_app.length > 0 ? (
                      <div className="w-full h-full relative cursor-pointer" onClick={() => setLightboxData({ images: projectSlides.web_app, currentIndex: activeSlide.web_app })}>
                        <img 
                          src={projectSlides.web_app[activeSlide.web_app] || projectSlides.web_app[0]} 
                          alt="Web App Preview" 
                          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono rounded-md">
                          {activeSlide.web_app + 1} / {projectSlides.web_app.length} (Klik Zoom)
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#202A3A]/50">Screenshot Web App</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#EDF2FA] scroll-mt-20">
        <div className="bg-[#EDF2FA] border border-[#202A3A]/10 rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-14 text-[#202A3A] shadow-lg relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#263B63]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Contact Information</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1 sm:mt-2 text-[#202A3A]">
              Mari Terhubung Bersama
            </h2>
            <p className="text-xs sm:text-sm text-[#202A3A]/80 mt-3 leading-relaxed">
              Terbuka untuk peluang karir sebagai IT Support, Infrastruktur, maupun Software Engineer. Hubungi saya melalui kontak di bawah ini.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-xs font-mono">
              <a href="mailto:ranggakurnia222@gmail.com" className="px-5 py-3 rounded-xl bg-white border border-[#202A3A]/15 text-[#202A3A] font-bold hover:bg-[#263B63] hover:text-white transition-all shadow-sm flex items-center gap-3">
                <img src="/logogmail.png" alt="Gmail" className="w-5 h-5 object-contain" />
                <span>ranggakurnia222@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/rangga-kurnia-sandhi-15550a328?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-white border border-[#202A3A]/15 text-[#202A3A] font-bold hover:bg-[#263B63] hover:text-white transition-all shadow-sm flex items-center gap-3">
                <img src="/logolinkedin.png" alt="LinkedIn" className="w-5 h-5 object-contain" />
                <span>Rangga Kurnnia Sandhi</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-[#EDF2FA] text-center text-xs text-[#202A3A]/60 font-mono">
        <p>© 2026 Rangga Kurnia Sandhi, S.Kom. All rights reserved.</p>
      </footer>

    </main>
  )
}