import { createRouter, createWebHistory } from 'vue-router';
import MainMap from '../views/MainMap.vue'; // Anpassen wenn du es MainMap genannt hast
import Events from '../views/Events.vue';

const routes = [
  {
    path: '/',
    name: 'Map',
    component: MainMap // Alles auf einer Karte
  },
  {
    path: '/events',
    name: 'Events',
    component: Events
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;