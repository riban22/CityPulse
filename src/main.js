// src/main.js
import { createApp } from 'vue'
import App from './App.vue'

// 🎨 Vuetify Importe
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // Icons

// Vuetify instanziieren und Dark Theme setzen
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark' 
  },
  icons: {
    defaultSet: 'mdi',
  },
})

// Vue App erstellen und mit Vuetify verknüpfen
createApp(App).use(vuetify).mount('#app')