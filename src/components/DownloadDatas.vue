<template>
  <div class="download-actions">
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
import { downloadCSV, downloadJSON } from '@/utils/DownloadData.js'

defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.download-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
