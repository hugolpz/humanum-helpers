<template>
  <div class="hh-layout">
    <!-- Header -->
    <header class="hh-header">
      <div class="hh-brand">
        <div class="hh-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--color-accent)" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="var(--color-accent)" stroke-width="1.5" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="var(--color-accent)" stroke-width="1.5" fill="none" opacity="0.6"/>
          </svg>
        </div>
        <div>
          <h1 class="hh-title">HeuristHelper</h1>
          <span class="hh-subtitle">SPARQL Explorer</span>
        </div>
      </div>
      <div class="hh-header-meta">
        <span v-if="endpoint" class="endpoint-pill">
          <span class="ep-dot" />
          {{ shortenUrl(endpoint) }}
        </span>
        <span v-if="loading" class="hh-status loading">
          <span class="spinner-sm" /> Querying…
        </span>
        <span v-else-if="error" class="hh-status error">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1L1 10h10L6 1zm0 5v2m0 2h.01"/>
          </svg>
          Error
        </span>
        <span v-else-if="results.length" class="hh-status success">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 6l3 3 5-5"/>
          </svg>
          {{ results.length }} results
        </span>
      </div>
    </header>

    <!-- Body -->
    <div class="hh-body">
      <!-- Sidebar -->
      <aside class="hh-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <button
          class="sidebar-toggle"
          @click="sidebarCollapsed = !sidebarCollapsed"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          id="sidebar-toggle-btn"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="!sidebarCollapsed" d="M9 2L4 7l5 5"/>
            <path v-else d="M5 2l5 5-5 5"/>
          </svg>
        </button>
        <div v-if="!sidebarCollapsed" class="sidebar-content">
          <QueriesSaved
            :current-query="query"
            @load="onQueryLoad"
          />
        </div>
      </aside>

      <!-- Main content -->
      <main class="hh-main">
        <!-- Editor -->
        <section class="hh-section">
          <QuerySparql
            v-model="query"
            :loading="loading"
            @run="runQuery"
            @update:endpoint="endpoint = $event"
          />
        </section>

        <!-- Error alert -->
        <transition name="fade">
          <div v-if="error" class="hh-error-alert" role="alert">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="6"/>
              <line x1="7" y1="4" x2="7" y2="7.5"/>
              <circle cx="7" cy="10" r=".5" fill="currentColor"/>
            </svg>
            <span>{{ error }}</span>
            <button class="btn btn-ghost err-close" @click="error = ''">✕</button>
          </div>
        </transition>

        <!-- Results (only when we have data) -->
        <template v-if="results.length || loading">
          <section class="hh-section result-section">
            <div v-if="loading" class="loading-overlay">
              <div class="loading-spinner">
                <div class="spin-ring" /><div class="spin-ring" /><div class="spin-ring" />
              </div>
              <p>Executing query…</p>
            </div>

            <QueryResponse
              v-if="!loading"
              :data="results"
              :rows="20"
            />
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QuerySparql          from '@/components/QuerySparql.vue'
import QueryResponse        from '@/components/QueryResponse.vue'
import QueriesSaved         from '@/components/QueriesSaved.vue'

import { isCommonsFilePath, resolveCommonsUrl, cleanGeoCoordinate, formatDateString } from '@/utils/ValueCleaner.js'

const defaultQueries = {
  short: `SELECT ?item ?itemLabel ?image 
  WHERE {
  ?item wdt:P31 wd:Q2239243; # Legendary creature
    wdt:P18 ?image.          # Image
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }
LIMIT 30`,
  japan: `SELECT 
  ?item 
  ?itemLabel 
  ?itemLabelJa
  (SAMPLE(?image) AS ?image)
  (SAMPLE(?dateFormatted) AS ?inceptionDate)
  (SAMPLE(?countryLabel) AS ?country)
  (SAMPLE(?coords) AS ?coordinates)
  (GROUP_CONCAT(DISTINCT ?materialLabel; separator="|") AS ?materials)
  (GROUP_CONCAT(DISTINCT ?cultureLabel; separator="|") AS ?cultures)
  (GROUP_CONCAT(DISTINCT ?religionLabel; separator="|") AS ?religions)
WHERE {
  # Subquery to gather entities and their individual labels
  {
    SELECT ?item ?nativeName ?image ?dateFormatted ?countryLabel ?coords ?materialLabel ?cultureLabel ?religionLabel WHERE {
      ?item wdt:P31 wd:Q15835. # Sacred object

     # OPTIONAL { ?item wdt:P1705 ?nativeName. }
      OPTIONAL { ?item wdt:P18 ?image. }
      OPTIONAL { ?item wdt:P17 ?country. }
      OPTIONAL { ?item wdt:P625 ?coords. }
      
      OPTIONAL { 
        ?item wdt:P571 ?inception. 
        BIND(STR(SUBSTR(STR(?inception), 1, 10)) AS ?dateFormatted)
      }

      # Fetching entities for the multi-value fields
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL { ?item wdt:P2596 ?culture. }
      OPTIONAL { ?item wdt:P140 ?religion. }

      # The Label Service lives inside the subquery to map labels to the variables above
      SERVICE wikibase:label { 
        bd:serviceParam wikibase:language "en". 
        ?country rdfs:label ?countryLabel.
        ?material rdfs:label ?materialLabel.
        ?culture rdfs:label ?cultureLabel.
        ?religion rdfs:label ?religionLabel.
      }
    }
  }

  # Get the Japanese and English labels for the main item
  OPTIONAL {
    ?item rdfs:label ?itemLabelJa.
    FILTER(LANG(?itemLabelJa) = "ja")
  }
  OPTIONAL {
    ?item rdfs:label ?itemLabel.
    FILTER(LANG(?itemLabel) = "en")
  }
}
GROUP BY ?item ?itemLabel ?itemLabelJa`
}

function defaultQuery() {
  return defaultQueries.japan
}

const query            = ref(defaultQuery())
const endpoint         = ref('https://query.wikidata.org/sparql')
const loading          = ref(false)
const error            = ref('')
const results          = ref([])
const sidebarCollapsed = ref(false)

async function runQuery({ query: q, endpoint: ep }) {
  loading.value = true
  error.value   = ''
  results.value = []

  try {
    const url = new URL(ep)
    url.searchParams.set('query', q)
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/sparql-results+json' },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    }

    const json = await res.json()
    const vars = json.results?.bindings[0] ? Object.keys(json.results.bindings[0]) : json.head?.vars ?? []
    results.value = json.results.bindings.map(b => {
      const row = {}
      vars.forEach(v => {
        let val = b[v]?.value ?? ''
        val = cleanGeoCoordinate(val)
        val = formatDateString(val)
        if (isCommonsFilePath(val)) {
          val = resolveCommonsUrl(val)
        }
        row[v] = val
      })
      return row
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function onQueryLoad(content) {
  query.value = content
}

function shortenUrl(url) {
  try {
    const u = new URL(url)
    return u.host + u.pathname.replace('/sparql', '')
  } catch { return url }
}

</script>

<style scoped>
/* ── Layout ── */
.hh-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ── Header ── */
.hh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20;
}

.hh-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hh-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(92,133,252,0.12);
  border-radius: 8px;
  border: 1px solid rgba(92,133,252,0.2);
}

.hh-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
}

.hh-subtitle {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.hh-header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.endpoint-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--color-muted);
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  border-radius: 99px;
}

.ep-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.hh-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
}
.hh-status.loading  { color: var(--color-accent); }
.hh-status.error    { color: var(--color-error); }
.hh-status.success  { color: var(--color-success); }

/* ── Body ── */
.hh-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ── */
.hh-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
  position: relative;
}

.hh-sidebar.collapsed {
  width: 40px;
  min-width: 40px;
}

.sidebar-toggle {
  position: absolute;
  right: -16px;
  top: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface2);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: color 0.15s, background 0.15s;
}
.sidebar-toggle:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

/* ── Main ── */
.hh-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hh-section {
  display: flex;
  flex-direction: column;
}

/* ── Error Alert ── */
.hh-error-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: 10px;
  color: var(--color-error);
  font-size: 13px;
  line-height: 1.5;
}

.err-close {
  margin-left: auto;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1;
  border-color: transparent;
}


/* ── Loading overlay ── */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-muted);
  font-size: 13px;
  gap: 16px;
}

.loading-spinner {
  position: relative;
  width: 40px;
  height: 40px;
}

.spin-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: spin-ring 1.2s cubic-bezier(0.5,0,0.5,1) infinite;
}
.spin-ring:nth-child(1) { border-top-color: var(--color-accent); animation-delay: -0.45s; }
.spin-ring:nth-child(2) { border-top-color: rgba(92,133,252,0.5); animation-delay: -0.3s; inset: 5px; }
.spin-ring:nth-child(3) { border-top-color: rgba(92,133,252,0.2); animation-delay: -0.15s; inset: 10px; }

@keyframes spin-ring { to { transform: rotate(360deg); } }

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hh-sidebar { display: none; }
  .hh-main { padding: 12px 14px; }
  .hh-header { padding: 0 12px; }
  .endpoint-pill { display: none; }
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
</style>
