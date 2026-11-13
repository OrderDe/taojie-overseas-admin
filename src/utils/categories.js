import { displayName } from './names'

export function descendantIds(rows, id) {
  const ids = new Set(id ? [String(id)] : [])
  let changed
  do {
    changed = false
    for (const row of rows) {
      if (ids.has(String(row.parentId || '')) && !ids.has(String(row.id))) {
        ids.add(String(row.id)); changed = true
      }
    }
  } while (changed)
  return ids
}
export function categoryPath(rows, id) {
  const map = new Map(rows.map(row => [String(row.id), row]))
  const parts = [], seen = new Set()
  while (id && map.has(String(id)) && !seen.has(String(id))) {
    seen.add(String(id))
    const row = map.get(String(id))
    parts.unshift(displayName(row.names))
    id = row.parentId
  }
  return parts.join(' / ')
}
export function categoryTree(rows, { excludeId = '', maxLevel = 3, keyword = '' } = {}) {
  const excluded = descendantIds(rows, excludeId)
  const nodes = new Map(rows.filter(row => !excluded.has(String(row.id)) && (row.level || 1) <= maxLevel)
    .map(row => [String(row.id), { ...row, id: String(row.id), label: displayName(row.names), children: [] }]))
  const roots = []
  for (const node of nodes.values()) {
    const parent = nodes.get(String(node.parentId || ''))
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const term = keyword.trim().toLowerCase()
  if (!term) return roots
  function filter(nodes) {
    return nodes.flatMap(node => {
      if ((Object.values(node.names || {}).join(' ') + ' ' + node.id).toLowerCase().includes(term)) return [node]
      const children = filter(node.children)
      return children.length ? [{ ...node, children }] : []
    })
  }
  return filter(roots)
}
