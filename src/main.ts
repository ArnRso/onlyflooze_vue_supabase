import { createApp } from 'vue'
import App from '@/App.vue'
import router from './router'
import './assets/main.css'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import 'vue-multiselect/dist/vue-multiselect.css'
import ui from '@nuxt/ui/vue-plugin'

const app = createApp(App)

router.isReady().then(() => {
  const redirect = sessionStorage.redirect
  delete sessionStorage.redirect
  if (redirect) {
    router.replace(redirect)
  }
  app.use(router)
  app.use(ui)
  // Ajout de TanStack Query
  const queryClient = new QueryClient()
  app.use(VueQueryPlugin, { queryClient })
  app.mount('#app')
})
