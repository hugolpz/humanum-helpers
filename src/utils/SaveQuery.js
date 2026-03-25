/**
 * SaveQuery.js
 *
 * Utility functions for persisting and loading SPARQL queries via the
 * Vite dev-server API plugin (vite.config.js).
 */

/**
 * Save a SPARQL query to the server under sparql/{filename}.sparql
 * @param {string} filename  - Desired filename (without .sparql extension)
 * @param {string} content   - The SPARQL query text
 * @returns {Promise<{ok: boolean, file: string}>}
 */
const LS_KEY = 'heurist_saved_queries'

function getLSQueries() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {}
  } catch {
    return {}
  }
}

function setLSQueries(queries) {
  localStorage.setItem(LS_KEY, JSON.stringify(queries))
}

export async function saveQuery(filename, content) {
  let backendOk = false
  try {
    const res = await fetch('/api/save-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content }),
    })
    backendOk = res.ok
  } catch (e) {
    console.warn("Backend save failed, falling back to localStorage", e)
  }

  if (!backendOk) {
    const queries = getLSQueries()
    queries[filename] = { content, mtime: Date.now() }
    setLSQueries(queries)
  }
}

export async function deleteQuery(filename) {
  // Delete from API
  try {
    await fetch('/api/delete-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
  } catch (e) {}

  // Delete from localStorage
  const queries = getLSQueries()
  const safe = filename.replace(/\.sparql$/, '')
  if (queries[safe]) {
    delete queries[safe]
    setLSQueries(queries)
  }
}

export async function listQueries() {
  const list = []
  
  try {
    const res = await fetch('/api/list-queries')
    if (res.ok) {
      list.push(...await res.json())
    }
  } catch (e) {}

  const ls = getLSQueries()
  for (const [name, meta] of Object.entries(ls)) {
    if (!list.find(q => q.title === name)) {
      list.push({
        name: `${name}.sparql`,
        title: name,
        mtime: meta.mtime,
        source: 'local'
      })
    }
  }

  return list.sort((a, b) => b.mtime - a.mtime)
}

export async function getQuery(filename) {
  try {
    const res = await fetch(`/api/get-query/${encodeURIComponent(filename)}`)
    if (res.ok) {
      const { content } = await res.json()
      return content
    }
  } catch (e) {}

  const title = filename.replace(/\.sparql$/, '')
  const ls = getLSQueries()
  if (ls[title]) {
    return ls[title].content
  }
  
  throw new Error(`Query ${filename} not found`)
}
