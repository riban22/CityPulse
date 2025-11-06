<script setup>
import { ref, onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Wichtig: Für das Styling der Karte!
import clubsData from './data/clubs.json'; // DEINE DATEN IMPORTIEREN

// --- 1. Vue State-Variablen (Speicher für sich ändernde Daten)
const selectedClub = ref(null); // Speichert den aktuell angeklickten Club
const clubs = ref(clubsData); // Lädt alle Club-Daten aus der JSON
const drawer = ref(true); // Steuert, ob die Sidebar offen ist

let map = null; // Variable für die Leaflet-Karte (muss außerhalb des Hooks definiert werden)

// --- 2. Leaflet-Karte initialisieren, sobald die Komponente fertig ist
onMounted(() => {
  // Beispiel-Zentrum: Ändere dies auf die Koordinaten deiner Stadt!
  const cityCenter = [52.5200, 13.4050]; 
  
  // Karte erstellen und in den Div-Container einfügen (wichtig: ID "map-container")
  map = L.map('map-container').setView(cityCenter, 13);

  // Kartengrafik (Tiles) hinzufügen
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap-Mitwirkende'
  }).addTo(map);

  // --- 3. Marker für jeden Club hinzufügen
  clubs.value.forEach(club => {
    // Überprüfe, ob Koordinaten vorhanden sind, um Fehler zu vermeiden
    if (club.coordinates && club.coordinates.lat && club.coordinates.lng) {
        const marker = L.marker([club.coordinates.lat, club.coordinates.lng]).addTo(map);

        // Klick-Logik: Wenn auf den Marker geklickt wird
        marker.on('click', () => {
          selectedClub.value = club; // Speichere die Club-Daten im State
          drawer.value = true; // Sidebar öffnen
        });

        // Optional: Kleiner Popup-Text über dem Marker
        marker.bindPopup(`<b>${club.name}</b>`);
    }
  });
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
