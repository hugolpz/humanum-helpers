<template>
  <div class="qr-table-container">
    <table class="qr-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col"
            class="qr-th"
            :class="{ sortable: true, sorted: sortCol === col }"
            @click="sortBy(col)"
          >
            <div class="qr-th-content">
              <span>{{ col }}</span>
              <svg v-if="sortCol === col" width="10" height="10" viewBox="0 0 10 10" fill="var(--color-accent)">
                <path v-if="sortDir === 'asc'" d="M5 2l4 6H1l4-6z"/>
                <path v-else d="M5 8L1 2h8l-4 6z"/>
              </svg>
              <svg v-else width="10" height="10" viewBox="0 0 10 10" fill="var(--color-muted)" opacity="0.4">
                <path d="M5 2l4 6H1l4-6z"/>
              </svg>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, ri) in paginatedRows"
          :key="ri"
          class="qr-tr"
        >
          <td v-for="col in columns" :key="col" class="qr-td">
            <template v-if="isCommonsFilePath(getCellValue(row, col))">
              <a
                :href="resolveCommonsUrl(getCellValue(row, col))"
                target="_blank"
                rel="noopener"
                class="commons-link"
              >
                <img
                  :src="getCommonsThumbnailUrl(resolveCommonsUrl(getCellValue(row, col)), 100)"
                  class="commons-thumb"
                  loading="lazy"
                  :alt="getCellValue(row, col)"
                  @error="onImgError"
                />
              </a>
            </template>
            <template v-else-if="isUrl(getCellValue(row, col))">
              <a :href="getCellValue(row, col)" target="_blank" rel="noopener" class="cell-link">
                {{ truncate(getCellValue(row, col), 60) }}
              </a>
            </template>
            <template v-else>
              {{ getCellValue(row, col) }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 1" class="qr-pagination">
      <button
        class="btn btn-ghost pag-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
        id="prev-page-btn"
      >← Prev</button>
      <span class="pag-info">Page {{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn btn-ghost pag-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
        id="next-page-btn"
      >Next →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { resolveCommonsUrl, isCommonsFilePath, getCommonsThumbnailUrl } from '@/utils/ValueCleaner.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  rows: { type: Number, default: 20 },
})

const sortCol     = ref(null)
const sortDir     = ref('asc')
const currentPage = ref(1)

watch(() => props.data, () => { currentPage.value = 1 })

const columns = computed(() => {
  if (!props.data?.length) return []
  return Object.keys(props.data[0])
})

function getCellValue(row, col) {
  const v = row[col]
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && v.value !== undefined) return v.value
  return String(v)
}

const sortedData = computed(() => {
  if (!sortCol.value) return props.data
  const col = sortCol.value
  return [...props.data].sort((a, b) => {
    const va = getCellValue(a, col).toLowerCase()
    const vb = getCellValue(b, col).toLowerCase()
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(props.data.length / props.rows)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.rows
  return sortedData.value.slice(start, start + props.rows)
})

function sortBy(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

function isUrl(val) {
  if (!val) return false
  try { const u = new URL(val); return u.protocol.startsWith('http') } catch { return false }
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str
}

function onImgError(e) { e.target.style.display = 'none' }
</script>

<style scoped>
.qr-table-container {
  overflow-x: auto;
  flex: 1;
}

.qr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.qr-th {
  padding: 9px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-surface2);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  user-select: none;
}
.qr-th.sortable { cursor: pointer; }
.qr-th-content { display: flex; align-items: center; gap: 4px; }
.qr-th.sortable:hover { color: var(--color-text); }
.qr-th.sorted { color: var(--color-accent); }

.qr-tr:nth-child(even) { background: rgba(255,255,255,0.02); }
.qr-tr:hover { background: rgba(92,133,252,0.05); }

.qr-td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(42,47,69,0.5);
  color: var(--color-text);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.commons-thumb {
  height: 48px;
  width: auto;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}

.cell-link, .commons-link {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.15s;
}
.cell-link:hover { text-decoration: underline; }

.qr-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface2);
}
.pag-info { font-size: 12px; color: var(--color-muted); }
.pag-btn { padding: 5px 12px; font-size: 12px; }
</style>
