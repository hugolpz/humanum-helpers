<template>
  <div class="img-gallery">
    <div v-if="!imageRows.length" class="img-empty">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-border)" stroke-width="1.5">
        <rect x="5" y="8" width="30" height="24" rx="3"/>
        <circle cx="13" cy="16" r="3"/>
        <path d="M5 28l8-8 5 5 5-6 12 9"/>
      </svg>
      <p>No image columns detected in results</p>
      <p class="img-hint">Expects a <code>?image</code> or <code>?pic</code> column with Commons URLs, or any column containing <code>Special:FilePath/</code></p>
    </div>

    <template v-else>
      <div class="img-grid">
        <div
          v-for="(img, i) in imageRows"
          :key="i"
          class="img-card"
          :id="`img-card-${i}`"
        >
          <a :href="img.uploadUrl" target="_blank" rel="noopener" class="img-link">
            <div class="img-frame">
              <img
                :src="getCommonsThumbnailUrl(img.uploadUrl, 250)"
                :alt="img.description"
                class="img-thumb"
                loading="lazy"
                @error="onImgError"
              />
              <div class="img-overlay">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" stroke-width="1.5">
                  <path d="M7 3H3.5A1.5 1.5 0 002 4.5v10A1.5 1.5 0 003.5 16h10A1.5 1.5 0 0015 14.5V11"/>
                  <path d="M11 2h5m0 0v5m0-5L9 9"/>
                </svg>
              </div>
            </div>
          </a>
          <div class="img-meta">
            <p class="img-desc">{{ img.description }}</p>
            <span v-if="img.item" class="img-item">
              <a :href="img.item" target="_blank" rel="noopener" class="cell-link">{{ shortLabel(img.item) }}</a>
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { resolveCommonsUrl, isCommonsFilePath, getCommonsThumbnailUrl } from '@/utils/ValueCleaner.js'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

function isImageColumn(col) {
  return ['image', 'img', 'pic', 'picture', 'photo', 'thumbnail', 'thumb', 'logo', 'depict']
    .some(k => col.toLowerCase().includes(k))
}

function getCellValue(row, col) {
  const v = row[col]
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && v.value !== undefined) return v.value
  return String(v)
}

function getItemValue(row) {
  const candidates = ['item', 'entity', 'subject', 'qid']
  for (const c of candidates) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === c) return getCellValue(row, key)
    }
  }
  return null
}

function getLabelValue(row) {
  const candidates = ['itemLabel', 'label', 'name', 'title', 'description']
  for (const c of candidates) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase().includes(c.toLowerCase())) return getCellValue(row, key)
    }
  }
  return null
}

const imageRows = computed(() => {
  if (!props.data?.length) return []
  const cols = Object.keys(props.data[0])

  const results = []
  for (const row of props.data) {
    for (const col of cols) {
      const val = getCellValue(row, col)
      if (isCommonsFilePath(val) || (isImageColumn(col) && val.includes('http'))) {
        let uploadUrl = val
        if (isCommonsFilePath(val)) {
          uploadUrl = resolveCommonsUrl(val)
        }
        results.push({
          uploadUrl,
          description: getLabelValue(row) || col,
          item: getItemValue(row),
        })
        break 
      }
    }
  }
  return results
})

function shortLabel(url) {
  try {
    const u = new URL(url)
    return u.pathname.split('/').filter(Boolean).pop() || url
  } catch { return url }
}

function onImgError(e) {
  e.target.closest('.img-card')?.classList.add('img-error')
  e.target.style.display = 'none'
}
</script>

<style scoped>
.img-gallery {
  overflow: auto;
  flex: 1;
}

.img-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
}
.img-hint { font-size: 11px; max-width: 340px; line-height: 1.6; }
.img-hint code {
  background: var(--color-surface2);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--color-accent);
}

.img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px;
}

.img-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-surface2);
  transition: transform 0.18s, box-shadow 0.18s;
}
.img-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
.img-link { display: block; }

.img-frame {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background: #0d0f1a;
  overflow: hidden;
}
.img-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.img-card:hover .img-thumb { transform: scale(1.05); }
.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.img-card:hover .img-overlay { opacity: 1; }

.img-meta { padding: 8px 10px; }
.img-desc {
  font-size: 11px;
  color: var(--color-text);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.img-item, .cell-link { font-size: 10px; color: var(--color-accent); text-decoration: none; }
.cell-link:hover { text-decoration: underline; }
.img-error { opacity: 0.3; }
</style>
