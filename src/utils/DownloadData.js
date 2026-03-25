import Papa from 'papaparse'

export function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename.split('/').pop()
  a.click()
  URL.revokeObjectURL(url)
}

function getCellValue(row, col) {
  const v = row[col]
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && v.value !== undefined) return v.value
  return String(v)
}

export function getCSVString(data) {
  if (!data || !data.length) return ''
  const columns = Object.keys(data[0])
  const flatData = data.map(row => Object.fromEntries(columns.map(c => [c, getCellValue(row, c)])))
  return Papa.unparse(flatData)
}

export function downloadCSV(data) {
  const csv = getCSVString(data)
  if (!csv) return
  triggerDownload(csv, 'query-result.csv', 'text/csv')
}

export function downloadJSON(data) {
  if (!data || !data.length) return
  const json = JSON.stringify(data, null, 2)
  triggerDownload(json, 'query-result.json', 'application/json')
}
