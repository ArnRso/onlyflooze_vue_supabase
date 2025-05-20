import { createApp } from 'vue'
import App from '@/App.vue'
import router from './router'
import './assets/main.css'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import 'vue-multiselect/dist/vue-multiselect.css'
import ui from '@nuxt/ui/vue-plugin'

const app = createApp(App)
app.use(router)
app.use(ui)
// Ajout de TanStack Query
const queryClient = new QueryClient()
app.use(VueQueryPlugin, { queryClient })

router.isReady().then(() => {
  const redirect = sessionStorage.redirect
  delete sessionStorage.redirect
  // Si on doit rediriger ET qu'on n'est pas déjà sur la bonne page, on redirige avant de monter l'app
  if (redirect && router.currentRoute.value.fullPath !== redirect) {
    router.replace(redirect).then(() => {
      app.mount('#app')
    })
  } else {
    app.mount('#app')
  }
})
