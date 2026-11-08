import { db } from '@lork/sdk'

export const OWNER_EMAIL = 'iryston1990@gmail.com'

// Пароль владельца сверяется по SHA-256 дайджесту, чтобы не хранить его в коде открытым текстом.
const OWNER_PASSWORD_SHA256 =
  '422e677f419bb65e5234bb1f3de8cf36cefc1d714acebfb7c15bac9a9fd0dfb3'

export async function isOwnerPassword(password: string): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return true
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )

  return hex === OWNER_PASSWORD_SHA256
}

const NEWS_TABLE = 'news'
const SUBMISSIONS_TABLE = 'news_submissions'

const MONTHS = [
  'Тъӕнджы мӕй',
  'Ӕртхъирӕны мӕй',
  'Тӕргӕйтты мӕй',
  'Хуымгӕнӕны мӕй',
  'Сыфтӕрты мӕй',
  'Хурхӕтӕны мӕй',
  'Сусӕны мӕй',
  'Майрӕмы мӕй',
  'Рухӕны мӕй',
  'Кӕфты мӕй',
  'Уастырджыйы мӕй',
  'Цыппурсы мӕй',
]

export type NewsItem = {
  id: string
  created_at: string
  title: string
  body: string
  author_email: string | null
  author_id: string | null
}

export type PendingNewsItem = {
  id: string
  created_at: string
  title: string
  body: string
  author_email: string | null
}

export function formatNewsDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} г.`
}

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await db
    .from(NEWS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as NewsItem[]
}

export async function fetchPendingNews(): Promise<PendingNewsItem[]> {
  const { data, error } = await db
    .from(SUBMISSIONS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PendingNewsItem[]
}

export async function publishNews(input: {
  title: string
  body: string
  authorEmail: string | null
  authorId: string | null
}): Promise<void> {
  const { error } = await db.from(NEWS_TABLE).insert({
    title: input.title,
    body: input.body,
    author_email: input.authorEmail,
    author_id: input.authorId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function submitNews(input: {
  title: string
  body: string
  authorEmail: string | null
}): Promise<void> {
  const { error } = await db.from(SUBMISSIONS_TABLE).insert({
    title: input.title,
    body: input.body,
    author_email: input.authorEmail,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteNews(id: string): Promise<void> {
  const { error } = await db.from(NEWS_TABLE).delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deletePendingNews(id: string): Promise<void> {
  const { error } = await db.from(SUBMISSIONS_TABLE).delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function approvePendingNews(item: PendingNewsItem): Promise<void> {
  await publishNews({
    title: item.title,
    body: item.body,
    authorEmail: item.author_email,
    authorId: null,
  })
  await deletePendingNews(item.id)
}
