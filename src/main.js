// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // NEU: Lade den Router

// Vuetify Importe
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark' // (Wir behalten das dunkle Theme für den Hintergrund)
  },
  icons: {
    defaultSet: 'mdi',
  },
})

createApp(App)
  .use(router) // NEU: Benutze den Router
  .use(vuetify)
  .mount('#app')