<template>
  <div class="download-actions">
    <button 
      v-if="activeTab === 'CSV' || activeTab === 'JSON'"
      class="btn btn-ghost btn-copy" 
      @click="copy" 
      :title="'Copy ' + activeTab"
    >
      <svg v-if="!copied" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="8" height="8" rx="1.5"/>
        <path d="M2 10V2.5A1.5 1.5 0 013.5 1h6"/>
      </svg>
      <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--color-success)" stroke-width="1.5">
        <path d="M3 7l2 2 5-5"/>
      </svg>
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
    <button class="btn btn-ghost" @click="() => downloadCSV(data)" title="Download CSV">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6.5 1v8M3.5 6.5l3 3 3-3"/><path d="M1.5 10.5h10"/>
      </svg>
      CSV
    </button>
    <button class="btn btn-ghost" @click="() => downloadJSON(data)" title="Download JSON">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6.5 1v8M3.5 6.5l3 3 3-3"/><path d="M1.5 10.5h10"/>
      </svg>
      JSON
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { downloadCSV, downloadJSON, getCSVString } from '@/utils/DownloadData.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' }
})

const copied = ref(false)

function copy() {
  const content = props.activeTab === 'CSV' 
    ? getCSVString(props.data) 
    : JSON.stringify(props.data, null, 2)
    
  if (!content) return
  
  navigator.clipboard.writeText(content).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<style scoped>
.download-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
