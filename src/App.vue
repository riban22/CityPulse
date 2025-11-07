<script setup>
import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import clubsData from './data/clubs.json'; 

// --- 1. Vue State-Variablen
const selectedClub = ref(null); 
const clubs = ref(clubsData); 
const drawer = ref(false); // WICHTIG: Sidebar ist standardmäßig geschlossen!

let map = null; 
let markers = []; 

// URL für den kostenlosen, dunklen Vektorstil (um die Karte sichtbar zu machen)
const mapStyleUrl = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

// --- Funktion zur Initialisierung der Karte und Marker
const initMap = (lat, lng, zoom = 15) => {
    map = new maplibregl.Map({
        container: 'map-container',
        style: mapStyleUrl,
        center: [lng, lat],
        zoom: zoom
    });
    
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 2. User-Marker hinzufügen
    new maplibregl.Marker({ color: '#ff0000' }) 
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Dein Standort'))
        .addTo(map);

    // 3. Marker für jeden Club hinzufügen
    clubs.value.forEach(club => {
        if (club.coordinates && club.coordinates.lat && club.coordinates.lng) {
            
            const marker = new maplibregl.Marker({ color: '#00ffff' }) 
                .setLngLat([club.coordinates.lng, club.coordinates.lat]) 
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(club.name))
                .addTo(map);

            // Klick-Logik: Klick auf den Marker öffnet das Vue-Sidebar-Popup
            marker.getElement().addEventListener('click', () => {
                selectedClub.value = club;
                drawer.value = true; // WICHTIG: Sidebar wird hier geöffnet!
            });
            
            markers.push(marker);
        }
    });
};

// --- Standortabfrage des Browsers
onMounted(() => {
    const munichCenter = { lat: 48.1351, lng: 11.5820, zoom: 13 }; 

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                initMap(userLat, userLng, 15);
            },
            (error) => {
                console.warn(`Geolocation Error: ${error.message}. Nutze Standardkoordinaten (München).`);
                initMap(munichCenter.lat, munichCenter.lng, munichCenter.zoom);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        console.log("Geolocation wird von diesem Browser nicht unterstützt. Nutze Standardkoordinaten.");
        initMap(munichCenter.lat, munichCenter.lng, munichCenter.zoom);
    }
});
</script>

<template>
  <v-app>
    <v-navigation-drawer 
      v-model="drawer" 
      temporary 
      app 
      width="350"
      color="#EBEBEB" 
      location="right"
      class="rounded-xl"
    >
      <v-card v-if="selectedClub" class="pa-4" color="#FFFFFF" flat rounded="lg"> 
        
        <v-card-title class="text-h5 text-black">{{ selectedClub.name }}</v-card-title>
        
        <v-chip 
          :color="selectedClub.capacity_simulated === 'High' ? 'red' : 'green-lighten-1'" 
          class="ma-2" 
          label
        >
          <v-icon start icon="mdi-account-group"></v-icon>
          Füllstand: {{ selectedClub.capacity_simulated }}
        </v-chip>

        <v-divider class="my-3"></v-divider>

        <v-list density="compact" bg-color="#FFFFFF" class="text-black">
          <v-list-item prepend-icon="mdi-music-note" :title="`Musik: ${selectedClub.music ? selectedClub.music.join(', ') : 'N/A'}`" class="text-black"></v-list-item>
          <v-list-item prepend-icon="mdi-account-multiple" :title="`Clientèle: ${selectedClub.clientele}`" class="text-black"></v-list-item>
          <v-list-item prepend-icon="mdi-account-search" :title="`Altersstruktur: ${selectedClub.age_structure}`" class="text-black"></v-list-item>
          <v-list-item prepend-icon="mdi-calendar-star" :title="`Events: ${selectedClub.next_event}`" class="text-black"></v-list-item>
          <v-list-item prepend-icon="mdi-train-car" :title="`Nächste Anbindung: ${selectedClub.next_station}`" class="text-black"></v-list-item>
        </v-list>

      </v-card>
      <v-card v-else class="pa-4" flat color="#FFFFFF" rounded="lg">
          <v-card-title class="text-black">Wähle einen Club auf der Karte aus.</v-card-title>
      </v-card>
    </v-navigation-drawer>

    <v-main>
      <div id="map-container"></div>
    </v-main>

  </v-app>
</template>

<style scoped>
/* Die Karte nimmt den gesamten Platz ein, da die Sidebar nun temporär ist */
#map-container {
  height: 100vh; /* Volle Höhe */
  width: 100%;
}

/* Den v-main Container wieder auf Standard zurücksetzen */
.v-main {
  margin: 0 !important; /* Entfernt den Margin */
  border-radius: 0;
  overflow: visible;
}
</style>
