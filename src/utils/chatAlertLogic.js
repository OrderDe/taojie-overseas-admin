// Pure helpers behind the admin chat alerts (menu badge, title flash,
// desktop notifications). Kept dependency-free so the rules can be unit
// checked outside the app and shared by the layout + chat page.

export function sumUnread(sessions) {
if (!Array.isArray(sessions)) return 0
return sessions.reduce((n, s) => n + (Number(s && s.unread) || 0), 0)
}

// Snapshot the per-session unread state used for change detection.
export function buildUnreadMap(sessions) {
const map = {}
if (!Array.isArray(sessions)) return map
for (const s of sessions) {
if (!s || s.id === null || s.id === undefined) continue
map[String(s.id)] = {
unread: Number(s.unread) || 0,
visitorName: s.visitorName || '访客',
lastMessage: s.lastMessage || ''
}
}
return map
}

// Decide which sessions got NEW visitor messages between two snapshots.
// - `initialized` is false for the very first snapshot after login: it is
// the baseline, so nothing counts as "new" (no notification spam for
// unread that was already there).
// - After that, a session counts when its unread number grew, or when it
// appears for the first time already carrying unread messages.
// - The session the agent currently has open never counts: they are
// looking at it, and reading it zeroes its unread anyway.
// - Unread shrinking (message read elsewhere) never counts.
export function detectNewArrivals(prevMap, sessions, activeSessionId, initialized) {
if (!initialized ||!Array.isArray(sessions)) return []
const prev = prevMap || {}
const activeId = activeSessionId === null || activeSessionId === undefined? null: String(activeSessionId)
const out = []
for (const s of sessions) {
if (!s || s.id === null || s.id === undefined) continue
const id = String(s.id)
const unread = Number(s.unread) || 0
if (unread <= 0 || id === activeId) continue
const before = prev[id]
if (!before || unread > before.unread) {
out.push({
id: s.id,
visitorName: s.visitorName || '访客',
lastMessage: s.lastMessage || '',
gained: before? unread - before.unread: unread
})
}
}
return out
}

// Title flashing runs only while there is something unread AND the agent
// is not already looking at the chat page (other page, or tab hidden).
export function shouldFlashTitle({ totalUnread, routeName, visible }) {
  return (Number(totalUnread) || 0) > 0 && (routeName !== 'chat' || !visible)
}

// One step of the title alternation: base <-> alert text.
export function nextFlashTitle(current, baseTitle, totalUnread) {
  const alert = '【' + totalUnread + ' 条新消息】'
  return current === alert ? baseTitle : alert
}
