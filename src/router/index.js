// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// Lade die Komponenten (Seiten)
import ClubMap from '../views/ClubMap.vue';
import Events from '../views/Events.vue';
import Bars from '../views/Bars.vue';

const routes = [
  {
    path: '/', // Startseite (Clubs)
    name: 'Clubs',
    component: ClubMap
  },
  {
    path: '/events', // Events-Seite
    name: 'Events',
    component: Events
  },
  {
    path: '/bars', // Bars-Seite
    name: 'Bars',
    component: Bars
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;