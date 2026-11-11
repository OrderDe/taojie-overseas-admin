// Multi-language name fields. Products, categories and brands all carry a
// names map { en, zh, es, fr, pt }; the admin UI edits all five in a form.

export const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '中文' },
  { key: 'es', label: 'Español' },
  { key: 'fr', label: 'Français' },
  { key: 'pt', label: 'Português' }
]

export function emptyNames() {
  return { en: '', zh: '', es: '', fr: '', pt: '' }
}

// Display name for tables: English first, then Chinese, then any value.
export function displayName(names) {
  if (!names) return '-'
  return names.en || names.zh || Object.values(names).find(Boolean) || '-'
}

// specs are edited as "Key: Value" lines in the product form.
export function specsToText(specs) {
  return Object.entries(specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n')
}

export function textToSpecs(text) {
  const out = {}
  for (const line of String(text || '').split('\n')) {
    const i = line.indexOf(':')
    if (i <= 0) continue
    const k = line.slice(0, i).trim()
    const v = line.slice(i + 1).trim()
    if (k) out[k] = v
  }
  return out
}
