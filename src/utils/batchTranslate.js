// Batch name translation for the products / categories / brands lists:
// fill every still-empty target language of every name that has a
// Chinese source, via the free MyMemory API (pinned per request with
// provider:'mymemory' — the server default stays the self-hosted
// LibreTranslate). Existing translations are never overwritten, no
// field other than `names` is changed, and descriptions/specs are out
// of scope (they are single-language fields).
//
// Verified API shapes (Node backend; the Java backend mirrors them):
// - GET /api/admin/products|categories|brands each return the FULL
//   list as a plain array — there is no server pagination on these
//   endpoints (the list pages paginate client-side) — so one GET is
//   the whole fetch, nothing to loop over.
// - Updates mirror each list page's own save payload, built from the
//   full list object so server-side validation sees what the edit
//   dialog would send (products validate the brand still exists):
//     products   PUT /api/admin/products/:id    {...item, names} minus id
//     categories PUT /api/admin/categories/:id  {names, sort}
//     brands     PUT /api/admin/brands/:id      {names, logo, sort, active}
import { api } from '../api/client'
import { TARGET_CODES, langByCode } from './langs'
import { displayName } from './names'

export const BATCH_KINDS = {
  products: {
    endpoint: '/api/admin/products',
    updatePath: (item) => `/api/admin/products/${item.id}`,
    buildPayload(item, names) {
      const payload = { ...item, names }
      delete payload.id
      return payload
    }
  },
  categories: {
    endpoint: '/api/admin/categories',
    updatePath: (item) => `/api/admin/categories/${encodeURIComponent(item.id)}`,
    buildPayload(item, names) {
      return { names, sort: item.sort || 0 }
    }
  },
  brands: {
    endpoint: '/api/admin/brands',
    updatePath: (item) => `/api/admin/brands/${encodeURIComponent(item.id)}`,
    buildPayload(item, names) {
      return { names, logo: item.logo || '', sort: item.sort || 0, active: item.active !== false }
    }
  }
}

const isBlank = (v) => !String(v || '').trim()

// Target languages still empty for one item, or null when the item is
// not a candidate (no Chinese source, or already fully translated).
export function missingTargets(item) {
  const names = item.names || {}
  if (isBlank(names.zh)) return null
  const missing = TARGET_CODES.filter((c) => isBlank(names[c]))
  return missing.length ? missing : null
}

const langName = (code) => (langByCode(code) || {}).name || code

/**
 * Run one batch. `onProgress(state)` is called after every item with
 * { total, processed, filled, failedCount } so the dialog can render
 * live progress. Resolves to a summary:
 * { total, candidates, skipped, processed, filled, failures, quotaStopped }
 * failures: [{ name, lang?, message }] — per-language entries carry the
 * language name in `lang`; whole-item entries (translate/save failed)
 * leave it empty.
 *
 * Quota protection: when one item fails in EVERY requested language —
 * or MyMemory reports quotaFinished — the run stops immediately.
 * Everything already saved stays saved, and a later run simply picks
 * up the items that are still incomplete, so the batch is resumable.
 */
export async function runBatchTranslate(kind, onProgress) {
  const cfg = BATCH_KINDS[kind]
  if (!cfg) throw new Error(`unknown batch kind: ${kind}`)
  const items = (await api(cfg.endpoint)) || []
  const summary = {
    total: items.length,
    candidates: 0,
    skipped: 0,
    processed: 0,
    filled: 0,
    failures: [],
    quotaStopped: false
  }
  const emit = () => {
    if (onProgress) {
      onProgress({
        total: summary.candidates,
        processed: summary.processed,
        filled: summary.filled,
        failedCount: summary.failures.length
      })
    }
  }

  const jobs = []
  for (const item of items) {
    const missing = missingTargets(item)
    if (missing) jobs.push({ item, missing })
    else summary.skipped++
  }
  summary.candidates = jobs.length
  emit()

  for (const { item, missing } of jobs) {
    const label = displayName(item.names)
    let r
    try {
      r = await api('/api/admin/translate', {
        method: 'POST',
        body: JSON.stringify({ text: String(item.names.zh).trim(), targets: missing, provider: 'mymemory' })
      })
    } catch (e) {
      // The endpoint only fails outright when EVERY target failed —
      // the classic MyMemory daily-quota symptom. Stop here; a later
      // run resumes with whatever is still untranslated.
      summary.failures.push({ name: label, message: `全部 ${missing.length} 个语种翻译失败：${e.message || '翻译服务不可用'}` })
      summary.processed++
      summary.quotaStopped = true
      emit()
      break
    }
    const translations = (r && r.translations) || {}
    const errors = (r && r.errors) || {}
    for (const code of Object.keys(errors)) {
      summary.failures.push({ name: label, lang: langName(code), message: errors[code] })
    }
    const names = { ...(item.names || {}) }
    let filledAny = false
    for (const code of missing) {
      if (translations[code] && isBlank(names[code])) {
        names[code] = translations[code]
        filledAny = true
      }
    }
    if (filledAny) {
      try {
        await api(cfg.updatePath(item), {
          method: 'PUT',
          body: JSON.stringify(cfg.buildPayload(item, names))
        })
        summary.filled++
      } catch (e) {
        summary.failures.push({ name: label, message: `保存失败：${e.message || '保存失败'}` })
      }
    }
    summary.processed++
    emit()
    if (r && r.meta && r.meta.quotaFinished) {
      summary.quotaStopped = true
      break
    }
  }
  return summary
}
