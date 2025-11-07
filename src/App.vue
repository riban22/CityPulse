<script setup>
import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl'; // NEU: MapLibre GL JS importieren
import clubsData from './data/clubs.json'; 

// --- 1. Vue State-Variablen
const selectedClub = ref(null); 
const clubs = ref(clubsData); 
const drawer = ref(true); 

let map = null; 
let markers = []; // Array, um Marker zu speichern (MapLibre Marker)

// URL für OpenMapTiles im "Dark" Stil (sehr sauber!)
// Nutzt den MapTiler Standardstil, der auf OpenMapTiles basiert
// Neuer Stil: Stadia Maps Light
const mapStyleUrl = 'https://tiles.stadiamaps.com/styles/alidade_smooth.json';
// ACHTUNG: Für kommerzielle Nutzung oder hohe Mengen brauchst du einen eigenen Key. 
// Du kannst den Key weglassen, um einen Default-Stil zu nutzen, oder MapTiler Key nutzen.

// --- NEU: Funktion zum Initialisieren der Karte und Marker (MapLibre Version)
const initMap = (lat, lng, zoom = 15) => {
    // 1. Karte erstellen und zentrieren
    map = new maplibregl.Map({
        container: 'map-container', // ID des HTML-Elements
        style: mapStyleUrl,         // Stil der OpenMapTiles
        center: [lng, lat],         // ACHTUNG: MapLibre erwartet [Lng, Lat]!
        zoom: zoom
    });
    
    // UI-Elemente hinzufügen (optional)
    map.addControl(new maplibregl.NavigationControl(), 'top-right');


    // 2. User-Marker hinzufügen
    // Marker-Erstellung in MapLibre ist anders als bei Leaflet/Google
    new maplibregl.Marker({ color: '#ff0000' }) // Roter Marker für den User
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Dein Standort'))
        .addTo(map);


    // 3. Marker für jeden Club hinzufügen
    clubs.value.forEach(club => {
        if (club.coordinates && club.coordinates.lat && club.coordinates.lng) {
            
            const marker = new maplibregl.Marker({ color: '#00ffff' }) // Cyan Marker für Clubs
                .setLngLat([club.coordinates.lng, club.coordinates.lat]) // ACHTUNG: [Lng, Lat]!
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(club.name))
                .addTo(map);

            // Klick-Logik: Klick auf den Marker öffnet das Vue-Sidebar-Popup
            marker.getElement().addEventListener('click', () => {
                selectedClub.value = club;
                drawer.value = true;
            });
            
            markers.push(marker);
        }
    });
};


// --- 4. Standortabfrage des Browsers (Logik bleibt gleich, da es Browser-API ist)
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
      app 
      temporary
      width="350"
      color="#121212"
      location="right"
    >
      <v-card v-if="selectedClub" class="pa-4" color="#1e1e1e" flat>
        <v-card-title class="text-h5 text-white">{{ selectedClub.name }}</v-card-title>
        
        <v-chip 
          :color="selectedClub.capacity_simulated === 'High' ? 'red' : 'green-lighten-1'" 
          class="ma-2" 
          label
        >
          <v-icon start icon="mdi-account-group"></v-icon>
          Füllstand: {{ selectedClub.capacity_simulated }}
        </v-chip>

        <v-divider class="my-3"></v-divider>

        <v-list density="compact" bg-color="#1e1e1e">
          <v-list-item prepend-icon="mdi-music-note" :title="`Musik: ${selectedClub.music.join(', ')}`"></v-list-item>
          <v-list-item prepend-icon="mdi-account-multiple" :title="`Clientèle: ${selectedClub.clientele}`"></v-list-item>
          <v-list-item prepend-icon="mdi-account-search" :title="`Altersstruktur: ${selectedClub.age_structure}`"></v-list-item>
          <v-list-item prepend-icon="mdi-calendar-star" :title="`Events: ${selectedClub.next_event}`"></v-list-item>
          <v-list-item prepend-icon="mdi-train-car" :title="`Nächste Anbindung: ${selectedClub.next_station}`"></v-list-item>
        </v-list>

      </v-card>
      <v-card v-else class="pa-4" flat color="#1e1e1e">
          <v-card-title>Wähle einen Club auf der Karte aus.</v-card-title>
      </v-card>
    </v-navigation-drawer>

    <v-main>
      <div id="map-container"></div>
    </v-main>

  </v-app>
</template>

<style scoped>
/* WICHTIG: Die Karte muss eine Höhe haben, sonst siehst du nichts! */
#map-container {
  height: 100vh; /* Nimmt die gesamte Bildschirmhöhe ein */
  width: 100%;
}
</style>
