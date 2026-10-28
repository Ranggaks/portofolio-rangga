'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase URL atau Anon Key belum diset di file .env.local')
  }

  return createClient(url, key)
}

interface PortfolioItem {
  id: string
  image_url: string | null
  updated_at?: string
}

const SLOT_LABELS: Record<string, { title: string; desc: string }> = {
  profile: { title: 'Foto Profil Utama', desc: 'Hero Section' },
  desktop_app: { title: 'Screenshot Proyek Desktop', desc: 'MI Al-Hikmah (Multi-Upload)' },
  mobile_app: { title: 'Screenshot Proyek Android', desc: 'PT Tampian Kencana Sejati (Multi-Upload)' },
  web_app: { title: 'Screenshot Proyek Web', desc: 'YRLOOKS Photography (Multi-Upload)' },
}

export default function AdminPage() {
  // State Autentikasi Password
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [slots, setSlots] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('profile')
  const [files, setFiles] = useState<FileList | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Cek sesi login di sessionStorage agar tidak perlu mengetik password ulang saat refresh tab
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Fungsi Login dengan Password 132132
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const ADMIN_PASSWORD = '132132'

    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setAuthError('')
    } else {
      setAuthError('Password salah! Silakan coba lagi.')
    }
  }

  // Fungsi Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
  }

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('id, image_url, updated_at')
        .order('id', { ascending: true })

      if (error) throw error
      if (data) setSlots(data)
    } catch (error: any) {
      console.error('Fetch Error:', error)
      const errMsg = error?.message || error?.toString() || 'Gagal memuat data dari database.'
      setMessage({ text: `Gagal memuat data: ${errMsg}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSlots()
    }
  }, [isAuthenticated])

  // Fungsi Upload Multi-File
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) {
      setMessage({ text: 'Pilih minimal satu file gambar terlebih dahulu.', type: 'error' })
      return
    }

    try {
      setActionLoading(true)
      setMessage({ text: `Mengunggah ${files.length} gambar untuk slot [${SLOT_LABELS[selectedCategory]?.title || selectedCategory}]...`, type: 'info' })

      const supabase = getSupabaseClient()
      let finalImageUrl = ''

      if (selectedCategory !== 'profile') {
        const existingSlot = slots.find((s) => s.id === selectedCategory)
        let currentUrls: string[] = existingSlot?.image_url ? existingSlot.image_url.split(',') : []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${selectedCategory}-${Date.now()}-${i}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(fileName, file, { upsert: true })

          if (uploadError) throw uploadError

          const { data: publicUrlData } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(fileName)

          currentUrls.push(publicUrlData.publicUrl)
        }

        finalImageUrl = currentUrls.join(',')
      } else {
        const file = files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `profile-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName)

        finalImageUrl = publicUrlData.publicUrl
      }

      const { error: dbError } = await supabase
        .from('portfolio_settings')
        .upsert({ id: selectedCategory, image_url: finalImageUrl, updated_at: new Date().toISOString() })

      if (dbError) throw dbError

      setMessage({ text: `Sukses memperbarui slot [${SLOT_LABELS[selectedCategory]?.title}].`, type: 'success' })
      setFiles(null)
      fetchSlots()
    } catch (error: any) {
      console.error('Upload Error:', error)
      const errMsg = error?.message || error?.toString() || 'Gagal mengunggah file.'
      setMessage({ text: `Gagal mengunggah: ${errMsg}`, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Fungsi Kosongkan Slot (Menggunakan .delete() agar bersih dari error batasan skema/null)
  const handleDeleteSlot = async (slotId: string) => {
    const slotName = SLOT_LABELS[slotId]?.title || slotId
    if (!confirm(`Apakah Anda yakin ingin mengosongkan slot "${slotName}"?`)) return

    try {
      setActionLoading(true)
      setMessage({ text: `Mengosongkan slot [${slotName}]...`, type: 'info' })

      const supabase = getSupabaseClient()
      const { error: dbError } = await supabase
        .from('portfolio_settings')
        .delete()
        .eq('id', slotId)

      if (dbError) {
        console.error('Supabase Delete Error:', dbError)
        throw new Error(dbError.message || JSON.stringify(dbError))
      }

      setMessage({ text: `Berhasil mengosongkan slot [${slotName}].`, type: 'success' })
      fetchSlots()
    } catch (error: any) {
      console.error('Delete Slot Error:', error)
      const errMsg = error?.message || error?.toString() || 'Terjadi kesalahan pada database.'
      setMessage({ text: `Gagal mengosongkan: ${errMsg}`, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // ================= TAMPILAN LOGIN JIKA BELUM AUTENTIKASI =================
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] text-[#202A3A] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#EDF2FA] p-8 rounded-[2.5rem] border border-[#EDF2FA] shadow-xl">
          <div className="text-center mb-6">
            <span className="w-3 h-3 rounded-full bg-[#263B63] inline-block mb-2 shadow-sm"></span>
            <h1 className="text-2xl font-extrabold text-[#202A3A]">Admin Authentication</h1>
            <p className="text-xs text-[#202A3A]/70 mt-1">Masukkan password admin untuk mengakses panel manajemen portofolio.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-[#202A3A]/80 mb-2">Password Admin</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#202A3A]/15 text-xs text-[#202A3A] focus:outline-none focus:border-[#263B63]"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-mono font-medium">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#263B63] text-white text-xs font-mono font-bold hover:bg-[#202A3A] transition-all shadow-md cursor-pointer"
            >
              Masuk Dashboard →
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-[#263B63] hover:underline font-medium">← Kembali ke Beranda</a>
          </div>
        </div>
      </main>
    )
  }

  // ================= DASHBOARD ADMIN UTAMA =================
  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#202A3A] font-sans antialiased p-4 sm:p-8 md:p-16 relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#EDF2FA] via-transparent to-transparent pointer-events-none -z-10 blur-3xl"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#202A3A05_1px,transparent_1px),linear-gradient(to_bottom,#202A3A05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10"></div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Admin */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EDF2FA] pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#263B63] font-semibold">Dashboard Pengelola</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202A3A] mt-1">Portfolio Media Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="px-4 py-2.5 rounded-xl bg-[#EDF2FA] text-[#263B63] text-xs font-semibold hover:bg-[#263B63] hover:text-white transition-all shadow-2xs flex items-center gap-2"
            >
              <span>Kembali ke Portofolio ↗</span>
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
            >
              Logout 🔒
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
            'bg-[#EDF2FA] border-[#EDF2FA] text-[#263B63]'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs font-bold px-2 py-1 hover:opacity-70">Tutup</button>
          </div>
        )}

        {/* Grid Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Form Upload Multi-File */}
          <div className="lg:col-span-5 bg-[#EDF2FA] p-6 sm:p-8 rounded-[2.5rem] border border-[#EDF2FA] shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-mono text-[#263B63] font-bold uppercase tracking-wider">Form Aksi</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#202A3A] mt-0.5">Upload Multi-File & Edit</h2>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#202A3A]/70 uppercase tracking-wider mb-2">Pilih Target Slot Website</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EDF2FA] text-xs sm:text-sm text-[#202A3A] focus:outline-none focus:border-[#263B63] font-medium"
                >
                  <option value="profile">Foto Profil Utama (Hero)</option>
                  <option value="desktop_app">Screenshot Proyek Desktop (Multi-Upload)</option>
                  <option value="mobile_app">Screenshot Proyek Android (Multi-Upload)</option>
                  <option value="web_app">Screenshot Proyek Web (Multi-Upload)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#202A3A]/70 uppercase tracking-wider mb-2">
                  {selectedCategory === 'profile' ? 'Pilih 1 File Gambar (PNG/JPG)' : 'Pilih Banyak File Gambar Sekaligus (Multi-Select)'}
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple={selectedCategory !== 'profile'}
                  onChange={(e) => setFiles(e.target.files)}
                  className="w-full text-xs text-[#202A3A] file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#263B63] file:text-white hover:file:bg-[#202A3A] cursor-pointer bg-white rounded-xl border border-[#EDF2FA]"
                />
                <p className="text-[10px] text-[#202A3A]/60 mt-1.5">
                  {selectedCategory === 'profile' ? 'Slot profil hanya menerima 1 gambar.' : 'Tahan tombol Ctrl / Shift pada keyboard untuk memilih beberapa gambar sekaligus.'}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={actionLoading}
                className="w-full py-3.5 rounded-xl bg-[#263B63] text-white text-xs sm:text-sm font-semibold hover:bg-[#202A3A] transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{actionLoading ? 'Memproses Berkas...' : 'Simpan & Perbarui Slot'}</span>
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Pratinjau Slot Aktif */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-mono uppercase tracking-wider text-[#263B63] font-bold">Pratinjau Slot Aktif di Database</h2>
              <button 
                onClick={fetchSlots} 
                className="text-xs font-mono text-[#263B63] underline hover:text-[#202A3A]"
              >
                Muat Ulang Data
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center bg-[#EDF2FA] rounded-[2.5rem] text-xs font-mono text-[#202A3A]/60">
                Memuat data slot portofolio...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center bg-[#EDF2FA] rounded-[2.5rem] text-xs font-mono text-[#202A3A]/60">
                Belum ada data slot di tabel database portfolio_settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {slots.map((item) => {
                  const meta = SLOT_LABELS[item.id] || { title: item.id, desc: 'Custom Slot' }
                  const imageUrls = item.image_url ? item.image_url.split(',') : []

                  return (
                    <div key={item.id} className="bg-[#EDF2FA] rounded-2xl border border-[#EDF2FA] p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-[#263B63]/30 transition-all">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-xs font-bold text-[#202A3A]">{meta.title}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-[#EDF2FA] rounded text-[#263B63]">
                            {imageUrls.length} File
                          </span>
                        </div>
                        <p className="text-[11px] text-[#202A3A]/60 mt-0.5">{meta.desc}</p>
                      </div>

                      {/* Kotak Gambar Preview */}
                      <div className="w-full aspect-video rounded-xl bg-white border border-[#EDF2FA] overflow-hidden flex items-center justify-center relative group">
                        {imageUrls.length > 0 && imageUrls[0] ? (
                          <img src={imageUrls[0]} alt={meta.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[11px] font-mono text-[#202A3A]/40 text-center p-2">
                            [ Slot Kosong ]
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedCategory(item.id)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-white border border-[#EDF2FA] text-[11px] font-semibold text-[#263B63] hover:bg-[#263B63] hover:text-white transition-all text-center cursor-pointer"
                        >
                          Tambah / Edit
                        </button>

                        {item.image_url && (
                          <button
                            onClick={() => handleDeleteSlot(item.id)}
                            disabled={actionLoading}
                            className="py-2 px-3 rounded-lg bg-white border border-rose-200 text-[11px] font-semibold text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-center cursor-pointer disabled:opacity-50"
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  )
}