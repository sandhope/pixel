import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'
import { init as initTheme } from './composables/useTheme'

initTheme()

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
