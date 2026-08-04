<template>
  <div class="app-root">
    <Toolbar @open-settings="showSettings = true" />
    <div class="body">
      <aside class="left-pane">
        <ShapePanel />
      </aside>
      <main class="center-pane">
        <EditorCanvas />
      </main>
      <aside class="right-pane">
        <RightPanel />
      </aside>
    </div>
    <SettingsDialog :visible="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Toolbar from '@/components/Toolbar.vue'
import ShapePanel from '@/components/ShapePanel.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import RightPanel from '@/components/RightPanel.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const showSettings = ref(false)
</script>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0b1220;
  color: #e2e8f0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-feature-settings: 'cv11', 'ss01';
}
.body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}
.left-pane {
  width: 280px;
  min-width: 260px;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.center-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.right-pane {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
