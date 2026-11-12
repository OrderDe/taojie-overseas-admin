// Multi-language name helpers. Products, categories and brands all carry
// a names map keyed by language code; the language list itself lives in
// the registry (utils/langs.js) — this module only shapes the maps.
import { LANGS as REGISTRY } from './langs'

// Legacy shape ({ key, label }) kept for existing imports.
export const LANGS = REGISTRY.map((l) => ({ key: l.code, label: l.label }))

export function emptyNames() {
  return Object.fromEntries(REGISTRY.map((l) => [l.code, '']))
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
