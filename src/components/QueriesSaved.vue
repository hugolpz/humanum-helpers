<template>
  <div class="qs-panel">
    <!-- Save form -->
    <div class="qs-save-form">
      <h3 class="qs-section-title">Save Query</h3>
      <div class="qs-input-row">
        <input
          id="query-title-input"
          v-model="title"
          class="input"
          type="text"
          placeholder="Query title…"
          @keydown.enter="save"
          aria-label="Query filename"
        />
        <button
          id="save-query-btn"
          class="btn btn-success"
          :disabled="!title.trim() || saving"
          @click="save"
        >
          <svg v-if="!saving" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 2h7l2 2v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z"/>
            <path d="M9 12V8H4v4M4 2v3h4"/>
          </svg>
          <span v-else class="spinner-sm" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
      <transition name="fade">
        <p v-if="saveMsg" class="save-msg" :class="saveMsgType">{{ saveMsg }}</p>
      </transition>
    </div>

    <div class="qs-divider" />

    <!-- Saved files list -->
    <div class="qs-list-section">
      <div class="qs-list-header">
        <h3 class="qs-section-title">Saved Queries</h3>
        <button id="refresh-queries-btn" class="btn btn-ghost btn-icon" @click="loadList" title="Refresh list">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 6.5A4.5 4.5 0 112 6.5"/>
            <path d="M11 3v3.5H7.5"/>
          </svg>
        </button>
      </div>

      <div v-if="loading" class="qs-loading">
        <span class="spinner-sm" /> Loading…
      </div>

      <ul v-else-if="queries.length" class="qs-list">
        <li
          v-for="q in queries"
          :key="q.name"
          class="qs-item"
          :id="`query-item-${q.title}`"
        >
          <button class="qs-item-btn" @click="load(q)" :title="`Load ${q.title}`">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 6h8M6 2l4 4-4 4"/>
            </svg>
            <span class="qs-item-name">{{ q.title }}</span>
            <span v-if="q.source === 'local'" class="qs-badge" title="Saved locally in browser">LS</span>
            <span class="qs-item-ext">.sparql</span>
          </button>
          <button class="btn btn-ghost btn-icon qs-delete-btn" @click.stop="remove(q)" title="Delete">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-error)" stroke-width="1.5" opacity="0.8">
              <path d="M2.5 3h7M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5v6a1 1 0 001 1h3a1 1 0 001-1v-6M5.5 5.5v3M6.5 5.5v3"/>
            </svg>
          </button>
        </li>
      </ul>

      <div v-else class="qs-empty-list">
        <p>No saved queries yet</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { saveQuery, listQueries, getQuery, deleteQuery } from '@/utils/SaveQuery.js'

const props = defineProps({
  currentQuery: { type: String, default: '' },
})

const emit = defineEmits(['load'])

const title    = ref('')
const saving   = ref(false)
const loading  = ref(false)
const queries  = ref([])
const saveMsg  = ref('')
const saveMsgType = ref('success')

let msgTimer = null

async function loadList() {
  loading.value = true
  try {
    queries.value = await listQueries()
  } catch (e) {
    showMsg('Failed to load list: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!title.value.trim()) return
  saving.value = true
  try {
    await saveQuery(title.value.trim(), props.currentQuery)
    showMsg(`Saved "${title.value.trim()}.sparql"`, 'success')
    title.value = ''
    await loadList()
  } catch (e) {
    showMsg('Save failed: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function load(q) {
  try {
    const content = await getQuery(q.name)
    emit('load', content)
  } catch (e) {
    showMsg('Load failed: ' + e.message, 'error')
  }
}

async function remove(q) {
  if (!confirm(`Delete "${q.title}"?`)) return
  loading.value = true
  try {
    await deleteQuery(q.title)
    showMsg(`Deleted "${q.title}"`, 'success')
    await loadList()
  } catch (e) {
    showMsg('Delete failed: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

function showMsg(msg, type = 'success') {
  saveMsg.value = msg
  saveMsgType.value = type
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { saveMsg.value = '' }, 3000)
}

onMounted(loadList)
</script>

<style scoped>
.qs-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.qs-save-form {
  padding: 14px;
}

.qs-section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0 0 10px 0;
}

.qs-input-row {
  display: flex;
  gap: 8px;
}

.save-msg {
  margin: 8px 0 0;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
}
.save-msg.success {
  background: rgba(52,211,153,0.1);
  color: var(--color-success);
  border: 1px solid rgba(52,211,153,0.25);
}
.save-msg.error {
  background: rgba(248,113,113,0.1);
  color: var(--color-error);
  border: 1px solid rgba(248,113,113,0.25);
}

.qs-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0;
}

.qs-list-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.qs-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.qs-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 12px;
  padding: 8px;
}

.qs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qs-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qs-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.qs-item-btn:hover {
  background: var(--color-surface2);
  border-color: var(--color-border);
}

.qs-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qs-item-ext {
  color: var(--color-muted);
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}

.qs-badge {
  font-size: 9px;
  background: rgba(92,133,252,0.15);
  color: var(--color-accent);
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.qs-delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}
.qs-item:hover .qs-delete-btn {
  opacity: 1;
}

.qs-empty-list {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-muted);
  font-size: 12px;
  text-align: center;
  padding: 24px 0;
}

.btn-icon {
  padding: 5px;
  width: 28px;
  height: 28px;
  justify-content: center;
}

.spinner-sm {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
