import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, LogOut, Mountain, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { auth, type LorkUser } from '@lork/sdk'
import { AuthModal, ModerationModal, SubmitModal } from '@/components/Modals'
import { OWNER_EMAIL, deleteNews, fetchNews, formatNewsDate, type NewsItem } from '@/lib/news'

type ModalName = 'login' | 'register' | 'submit' | 'moderate' | null

const outlineButtonClass =
  'inline-flex items-center gap-2 rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:border-[#A8A29E] hover:text-[#7F1D1D]'

const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-lg bg-[#B91C1C] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#991B1B]'

export default function Home() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [user, setUser] = useState<LorkUser | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [modal, setModal] = useState<ModalName>(null)
  const [bannerVisible, setBannerVisible] = useState(false)

  const loadNews = useCallback(async () => {
    setLoadingNews(true)
    try {
      const news = await fetchNews()
      setItems(news)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setLoadingNews(false)
    }
  }, [])

  const loadSession = useCallback(async () => {
    try {
      const currentUser = await auth.getUser()
      setUser(currentUser)
      const roles = currentUser ? await auth.getRoles() : []
      setIsOwner(roles.includes('admin'))
    } catch {
      setUser(null)
      setIsOwner(false)
    }
  }, [])

  useEffect(() => {
    void loadNews()
    void loadSession()
  }, [loadNews, loadSession])

  useEffect(() => {
    if (!bannerVisible) {
      return
    }

    const timer = window.setTimeout(() => setBannerVisible(false), 4000)
    return () => window.clearTimeout(timer)
  }, [bannerVisible])

  async function handleSignOut() {
    try {
      await auth.signOut()
    } finally {
      setUser(null)
      setIsOwner(false)
    }
  }

  async function handleDelete(item: NewsItem) {
    if (!window.confirm('Удалить новость?')) {
      return
    }

    try {
      await deleteNews(item.id)
      await loadNews()
    } catch {
      window.alert('Не удалось удалить новость. Попробуйте ещё раз.')
    }
  }

  function handleSubmitted() {
    setModal(null)
    setBannerVisible(true)
    void loadNews()
  }

  async function handleAuthenticated() {
    await loadSession()
    setModal(null)
  }

  const canDelete = (item: NewsItem) => isOwner || Boolean(user && item.author_id === user.id)
  const ownerRightsPending = Boolean(user && user.email === OWNER_EMAIL && !isOwner)

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="sticky top-0 z-40 border-b border-[#E7E5E4] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-[#1C1917]">
            <Mountain className="h-6 w-6 text-[#B91C1C]" strokeWidth={2.4} aria-hidden="true" />
            Ирыстон
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setModal('moderate')}
                className={outlineButtonClass}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Фидар кӕны
              </button>
            )}

            <button type="button" onClick={() => setModal('submit')} className={primaryButtonClass}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Хабӕрттӕ бахӕсс
            </button>

            {user ? (
              <button type="button" onClick={() => void handleSignOut()} className={outlineButtonClass}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Рахиз
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setModal('login')} className={outlineButtonClass}>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Бахиз
                </button>
                <button
                  type="button"
                  onClick={() => setModal('register')}
                  className={outlineButtonClass}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Дӕхи бафысс
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative h-[60vh] min-h-[320px] w-full overflow-hidden">
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 33.33%, #CE1126 33.33%, #CE1126 66.66%, #FFD100 66.66%, #FFD100 100%)',
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0C0A09]/90 via-[#0C0A09]/25 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 sm:px-12">
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_18px_rgba(12,10,9,0.65)] sm:text-7xl">
            Ирыстон
          </h1>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[750px] px-4 py-10 sm:px-6">
        {ownerRightsPending && (
          <p className="mb-6 rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm text-[#57534E]">
            Права владельца для этого аккаунта ещё не подтверждены — модерация пока недоступна.
          </p>
        )}

        {bannerVisible && (
          <p className="mb-6 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-sm font-medium text-[#047857]">
            Хабар фидар кӕнын цӕуы
          </p>
        )}

        {loadingNews ? (
          <div className="space-y-6" aria-hidden="true">
            <div className="h-40 animate-pulse rounded-2xl border border-[#E7E5E4] bg-white" />
            <div className="h-40 animate-pulse rounded-2xl border border-[#E7E5E4] bg-white" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            <p>Не удалось загрузить новости.</p>
            <button
              type="button"
              onClick={() => void loadNews()}
              className="mt-2 font-semibold underline underline-offset-2 hover:text-[#7F1D1D]"
            >
              Повторить
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-lg text-[#78716C]">Хабӕрттӕ дзы нырма нӕй</p>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="news-card-in rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg"
              >
                <p className="text-sm font-semibold text-[#B91C1C]">
                  {formatNewsDate(item.created_at)}
                </p>
                <h2 className="mt-2 text-xl font-bold leading-snug text-[#1C1917] sm:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#44403C]">
                  {item.body}
                </p>
                {canDelete(item) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#D6D3D1] bg-white px-3 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:border-[#A8A29E] hover:text-[#7F1D1D]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Айсын
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {(modal === 'login' || modal === 'register') && (
        <AuthModal
          mode={modal}
          onModeChange={(nextMode) => setModal(nextMode)}
          onClose={() => setModal(null)}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {modal === 'submit' && (
        <SubmitModal
          isOwner={isOwner}
          authorEmail={user?.email ?? null}
          authorId={user?.id ?? null}
          onClose={() => setModal(null)}
          onSubmitted={handleSubmitted}
        />
      )}

      {modal === 'moderate' && (
        <ModerationModal onClose={() => setModal(null)} onChanged={() => void loadNews()} />
      )}
    </div>
  )
}
