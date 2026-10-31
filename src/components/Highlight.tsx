import { queryWords } from '../lib/filter'

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Text with every word of the search query wrapped in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = queryWords(query)
  if (!words.length) return text
  // Longest first, so "playwright" wins over "play" when both are typed.
  const pattern = new RegExp(`(${words.sort((a, b) => b.length - a.length).map(escape).join('|')})`, 'gi')
  // split() with a capture group puts the matches at odd indexes.
  return text.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}
