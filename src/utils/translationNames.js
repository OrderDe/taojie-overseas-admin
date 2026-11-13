// Imported copies of the Chinese name are placeholders, not translations.
export function isUntranslatedName(value, chinese) {
  const target = String(value || '').trim()
  const source = String(chinese || '').trim()
  return !target || (/\p{Script=Han}/u.test(source) && target === source)
}
