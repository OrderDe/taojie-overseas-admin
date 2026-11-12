// Language registry — the single source of truth for which languages a
// name can be entered in. To add a language later: add one row here and
// extend the backend allowlist to match (TRANSLATE_TARGETS in the Node
// server's src/server.js, ALL_TARGETS in the Java translate service).
//   code  — ISO code used as the key in every names JSON map
//   name  — Chinese name, used in admin-facing messages
//   label — the language's own name, used as the form field label
export const LANGS = [
  { code: 'en', name: '英语', label: 'English' },
  { code: 'zh', name: '中文', label: '中文' },
  { code: 'es', name: '西班牙语', label: 'Español' },
  { code: 'fr', name: '法语', label: 'Français' },
  { code: 'pt', name: '葡萄牙语', label: 'Português' },
  { code: 'id', name: '印尼语', label: 'Bahasa Indonesia' },
  { code: 'ms', name: '马来语', label: 'Bahasa Melayu' },
  { code: 'vi', name: '越南语', label: 'Tiếng Việt' },
  { code: 'th', name: '泰语', label: 'ไทย' },
  { code: 'ar', name: '阿拉伯语', label: 'العربية' },
  { code: 'ru', name: '俄语', label: 'Русский' },
  { code: 'de', name: '德语', label: 'Deutsch' }
]

// Names are always authored in Chinese; everything else is a target.
export const SOURCE_CODE = 'zh'
export const TARGET_CODES = LANGS.map((l) => l.code).filter((c) => c !== SOURCE_CODE)

export function langByCode(code) {
  return LANGS.find((l) => l.code === code)
}
