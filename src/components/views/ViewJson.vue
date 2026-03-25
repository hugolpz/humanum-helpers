<template>
  <div class="qr-json-container">
    <pre class="qr-json">{{ JSON.stringify(data, null, 2) }}</pre>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Array, default: () => [] }
})
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
