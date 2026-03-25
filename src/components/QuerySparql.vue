<template>
  <div class="sparql-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <span class="editor-label">SPARQL Query</span>
        <span v-if="modelValue" class="badge badge-blue">{{ lineCount }} lines</span>
      </div>
      <div class="toolbar-right">
        <input
          id="endpoint-url"
          v-model="endpointUrl"
          class="input endpoint-input"
          type="url"
          placeholder="https://query.wikidata.org/sparql"
          aria-label="SPARQL endpoint URL"
        />
        <button
          id="run-query-btn"
          class="btn btn-primary"
          :disabled="loading || !modelValue.trim()"
          @click="runQuery"
          :title="loading ? 'Running…' : 'Execute SPARQL query'"
        >
          <svg v-if="!loading" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 2l9 5-9 5V2z"/>
          </svg>
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Running…' : 'Run Query' }}
        </button>
      </div>
    </div>

    <!-- CodeMirror editor -->
    <div class="cm-wrapper" id="codemirror-wrapper">
      <Codemirror
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :extensions="extensions"
        :style="{ height: '340px' }"
        :autofocus="true"
        placeholder="Write your SPARQL query here…"
      />
    </div>

    <!-- Error display -->
    <transition name="fade">
      <div v-if="error" class="query-error" role="alert">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="7" cy="7" r="6"/><line x1="7" y1="4" x2="7" y2="7.5"/><circle cx="7" cy="10" r=".5" fill="currentColor"/>
        </svg>
        {{ error }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { sparql } from '@codemirror/legacy-modes/mode/sparql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const props = defineProps({
  modelValue: { type: String, default: '' },
  loading:    { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'run', 'update:endpoint'])

const endpointUrl = ref('https://query.wikidata.org/sparql')
const error = ref('')

const lineCount = computed(() => props.modelValue.split('\n').length)

const extensions = [
  StreamLanguage.define(sparql),
  oneDark,
  EditorView.theme({
    '&': { fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" },
    '.cm-content': { padding: '12px 0', minHeight: '300px' },
    '.cm-gutters': { backgroundColor: '#1a1d2e', borderRight: '1px solid #2a2f45' },
    '.cm-lineNumbers': { color: '#4a5080' },
    '.cm-activeLine': { backgroundColor: 'rgba(92,133,252,0.07)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(92,133,252,0.1)' },
    '.cm-focused': { outline: 'none' },
    '.cm-selectionBackground': { backgroundColor: 'rgba(92,133,252,0.25) !important' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(92,133,252,0.35) !important' },
  }),
  EditorView.lineWrapping,
]

function runQuery() {
  error.value = ''
  if (!endpointUrl.value) {
    error.value = 'Please enter a SPARQL endpoint URL.'
    return
  }
  emit('update:endpoint', endpointUrl.value)
  emit('run', { query: props.modelValue, endpoint: endpointUrl.value })
}
</script>

<style scoped>
.sparql-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-surface);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-surface2);
  border-bottom: 1px solid var(--color-border);
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.editor-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.endpoint-input {
  max-width: 320px;
  height: 34px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
}

.cm-wrapper {
  background: #1a1d2e;
}
.cm-wrapper :deep(.cm-editor) {
  background: #1a1d2e !important;
}

.query-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 12px;
  padding: 8px 12px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 12px;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
