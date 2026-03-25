<template>
  <div class="qr-wrapper">
    <div v-if="!data || data.length === 0" class="qr-empty">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-border)" stroke-width="1.5">
        <rect x="6" y="8" width="28" height="24" rx="3"/>
        <line x1="12" y1="15" x2="28" y2="15"/>
        <line x1="12" y1="20" x2="24" y2="20"/>
        <line x1="12" y1="25" x2="20" y2="25"/>
      </svg>
      <p>Run a query to see results here</p>
    </div>

    <template v-else>
      <div class="qr-topbar">
        <div class="qr-stats">
          <span class="badge badge-blue">{{ data.length }} rows</span>
          <span class="badge badge-green">{{ columns.length }} columns</span>
        </div>

        <div class="tabs">
          <button
            v-for="tab in ['Table', 'Gallery', 'JSON', 'CSV']"
            :key="tab"
            class="tab"
            :class="{ active: activeTab === tab }"
            :id="`tab-${tab.toLowerCase()}`"
            @click="activeTab = tab"
          >{{ tab }}</button>
        </div>

        <DownloadDatas :data="data" :active-tab="activeTab" />
      </div>

      <component :is="activeComponent" :data="data" :rows="rows" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DownloadDatas from '@/components/DownloadDatas.vue'

import ViewTable   from '@/components/views/ViewTable.vue'
import ViewGallery from '@/components/views/ViewGallery.vue'
import ViewJson    from '@/components/views/ViewJson.vue'
import ViewCsv     from '@/components/views/ViewCsv.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  rows: { type: Number, default: 20 },
})

const activeTab = ref('Table')

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'Table':   return ViewTable
    case 'Gallery': return ViewGallery
    case 'JSON':    return ViewJson
    case 'CSV':     return ViewCsv
    default:        return ViewTable
  }
})

const columns = computed(() => {
  if (!props.data?.length) return []
  return Object.keys(props.data[0])
})
</script>

<style scoped>
.qr-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-surface);
  min-height: 200px;
  max-height: 800px;
}

.qr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  padding: 48px;
  color: var(--color-muted);
  font-size: 13px;
}

.qr-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--color-surface2);
  border-bottom: 1px solid var(--color-border);
  gap: 10px;
  flex-wrap: wrap;
}

.qr-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
