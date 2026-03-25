<template>
  <div class="qr-json-container">
    <pre class="qr-json">{{ csvString }}</pre>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getCSVString } from '@/utils/DownloadData.js'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

const csvString = computed(() => getCSVString(props.data))
</script>

<style scoped>
.qr-json-container {
  overflow: auto;
  flex: 1;
  max-height: 500px;
}
.qr-json {
  padding: 16px; margin: 0;
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: #a8b4d8; line-height: 1.6; white-space: pre;
}
</style>
