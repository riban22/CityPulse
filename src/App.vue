<script setup>
import { ref, onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Wichtig: Für das Styling der Karte!
import clubsData from './data/clubs.json'; // DEINE DATEN IMPORTIEREN

// --- 1. Vue State-Variablen
const selectedClub = ref(null); // Speichert den aktuell angeklickten Club
const clubs = ref(clubsData); // Lädt alle Club-Daten aus der JSON
const drawer = ref(true); // Steuert, ob die Sidebar offen ist

let map = null; // Variable für die Leaflet-Karte

// --- NEU: Funktion zur Initialisierung der Karte und Marker
const initMap = (lat, lng, zoom = 15) => {
    // 1. Karte erstellen und zentrieren
    // Die Variable 'map' muss initialisiert werden, bevor sie in der Komponente verwendet wird
    map = L.map('map-container').setView([lat, lng], zoom);

    // 2. Kartengrafik (Tiles) hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap-Mitwirkende'
    }).addTo(map);

    // 3. User-Marker hinzufügen (optional, aber hilfreich)
    // Wir setzen einen Marker an der aktuellen Position des Nutzers
    L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup("Dein Standort").openPopup();


    // 4. Marker für jeden Club hinzufügen
    clubs.value.forEach(club => {
        if (club.coordinates && club.coordinates.lat && club.coordinates.lng) {
            const marker = L.marker([club.coordinates.lat, club.coordinates.lng]).addTo(map);

            marker.on('click', () => {
                selectedClub.value = club;
                drawer.value = true;
            });

            marker.bindPopup(`<b>${club.name}</b>`);
        }
    });
};


// --- 5. Leaflet-Karte initialisieren (Mit Standortabfrage)
onMounted(() => {
    // Standard-München-Zentrum (als Fallback, falls Standort abgelehnt wird)
    const munichCenter = { lat: 48.1351, lng: 11.5820, zoom: 13 }; 

    // Geolocation-API des Browsers verwenden
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Erfolg: Standort gefunden
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                initMap(userLat, userLng, 15); // Zoom etwas näher
            },
            // Fehler/Ablehnung: Standort nicht gefunden oder abgelehnt
            (error) => {
                console.warn(`Geolocation Error: ${error.message}. Nutze Standardkoordinaten (München).`);
                initMap(munichCenter.lat, munichCenter.lng, munichCenter.zoom);
            },
            // Optionen 
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        // Browser unterstützt Geolocation nicht
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
