<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import clubsData from '../data/clubs.json'; 

// --- 1. Vue State-Variablen
const selectedClub = ref(null); 
const clubs = ref(clubsData); 
const drawer = ref(false); 
const activeFilters = ref([]); 
const availableGenres = ['Techno', 'House', 'Hip Hop', 'Electro', 'R&B']; 

// NEU: Suchvariablen
const searchInput = ref(''); // Das Suchfeld
const searchMenu = ref(false); // Steuert das Öffnen/Schließen des Such-Dropdowns
const highlightMarker = ref(null); // Speichert den Marker, der hervorgehoben werden soll

let map = null; 
let markers = []; 

const mapStyleUrl = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';


// --- Filter-Logik (Bleibt gleich)
const filteredClubs = computed(() => {
    if (activeFilters.value.length === 0) {
        return clubs.value; 
    }
    return clubs.value.filter(club => 
      club.music && club.music.some(genre => activeFilters.value.includes(genre))
    );
});

// NEU: Suchlogik
const searchedClubs = computed(() => {
    if (!searchInput.value) {
        return filteredClubs.value; // Zeige alle gefilterten Clubs, wenn Suchfeld leer ist
    }
    const searchTerm = searchInput.value.toLowerCase();
    return filteredClubs.value.filter(club => 
        club.name.toLowerCase().includes(searchTerm)
    );
});


// --- Funktion zum Aktualisieren der Karte und Marker
const updateMapMarkers = () => {
    markers.forEach(marker => marker.remove());
    markers = [];

    filteredClubs.value.forEach(club => { // Achtung: Hier immer noch filteredClubs verwenden, nicht searchedClubs
        if (club.coordinates && club.coordinates.lat && club.coordinates.lng) {
            
            // Markerfarbe basierend auf highlightMarker setzen
            const markerColor = highlightMarker.value && highlightMarker.value.id === club.id ? '#ff00ff' : '#00ffff'; // Lila für Highlight
            const marker = new maplibregl.Marker({ color: markerColor }) 
                .setLngLat([club.coordinates.lng, club.coordinates.lat]) 
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(club.name))
                .addTo(map);

            marker.getElement().addEventListener('click', () => {
                selectedClub.value = club;
                drawer.value = true;
            });
            
            markers.push(marker);
        }
    });
};


// NEU: Funktion zum Springen auf der Karte
const jumpToClub = (club) => {
    if (map && club.coordinates) {
        map.flyTo({
            center: [club.coordinates.lng, club.coordinates.lat],
            zoom: 16, // Zoomt näher heran
            essential: true 
        });
        selectedClub.value = club; // Öffnet Sidebar
        drawer.value = true; 
        highlightMarker.value = club; // Markiert den Marker
        updateMapMarkers(); // Marker aktualisieren, um Highlight zu zeigen
        searchMenu.value = false; // Suchmenü schließen
    }
};


// --- Watcher für den Filter (Bleibt gleich)
watch(activeFilters, () => {
    if (map) {
        updateMapMarkers();
    }
}, { deep: true }); 


// --- Funktion zur Initialisierung der Karte und Marker (INIT)
const initMap = (lat, lng, zoom = 15) => {
    map = new maplibregl.Map({
        container: 'map-container',
        style: mapStyleUrl,
        center: [lng, lat],
        zoom: zoom
    });
    
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    new maplibregl.Marker({ color: '#ff0000' }) 
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Dein Standort'))
        .addTo(map);

    updateMapMarkers();
};


// --- Standortabfrage des Browsers (onMounted)
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
  <div>
    <v-menu offset-y>
        <template v-slot:activator="{ props }">
            <v-btn 
                v-bind="props"
                icon="mdi-filter"
                size="large"
                color="white"
                elevation="5"
                class="filter-fab"
            >
            </v-btn>
        </template>

        <v-list class="pa-2" :bg-color="activeFilters.length > 0 ? 'red-lighten-4' : 'white'">
            <v-list-item-title class="pa-2 font-weight-bold text-black">Musik filtern:</v-list-item-title>
            <v-divider></v-divider>
            <v-list-item
                v-for="genre in availableGenres"
                :key="genre"
                density="compact"
            >
                <v-checkbox
                    v-model="activeFilters"
                    :label="genre"
                    :value="genre"
                    hide-details
                    class="ml-2"
                    density="compact"
                    color="primary"
                ></v-checkbox>
            </v-list-item>
             <v-list-item v-if="activeFilters.length > 0">
                <v-btn 
                    @click="activeFilters = []" 
                    block 
                    size="small" 
                    variant="flat" 
                    color="grey-lighten-2"
                    class="mt-2 text-black"
                >
                    Filter zurücksetzen
                </v-btn>
            </v-list-item>
        </v-list>
    </v-menu>

    <v-menu 
        v-model="searchMenu" 
        offset-y 
        :close-on-content-click="false"
        class="search-menu"
    >
        <template v-slot:activator="{ props }">
            <v-btn 
                v-bind="props"
                icon="mdi-magnify"
                size="large"
                color="white"
                elevation="5"
                class="search-fab"
            >
            </v-btn>
        </template>

        <v-card class="pa-2" width="300">
            <v-text-field
                v-model="searchInput"
                label="Club suchen..."
                variant="outlined"
                density="compact"
                hide-details
                clearable
                autofocus
                class="mb-2"
            ></v-text-field>

            <v-divider></v-divider>

            <v-list dense class="scrollable-list">
                <v-list-item
                    v-for="club in searchedClubs"
                    :key="club.id"
                    @click="jumpToClub(club)"
                    link
                >
                    <v-list-item-title>{{ club.name }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="searchedClubs.length === 0">
                    <v-list-item-title class="text-caption text-grey-darken-1">Keine Ergebnisse</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>


    <v-navigation-drawer 
        v-model="drawer" 
        temporary
        width="350"
        color="#EBEBEB" 
        location="right"
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

    <div id="map-container"></div>
  </div>
</template>

<style scoped>
#map-container {
  height: 100vh; 
  width: 100%;
  position: absolute; 
  top: 0;
  left: 0;
}

.v-navigation-drawer {
    z-index: 2000;
}

.filter-fab {
    position: absolute;
    top: 80px; 
    left: 16px; 
    z-index: 1000;
    border-radius: 50%; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* NEU: Styling für den Such-Button und das Menü */
.search-fab {
    position: absolute;
    top: 144px; /* Platziert ihn unter dem Filter-Button (80px + 48px Button-Höhe + 16px Abstand) */
    left: 16px; 
    z-index: 1000;
    border-radius: 50%; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Scrollbare Liste im Suchmenü */
.scrollable-list {
    max-height: 200px; /* Begrenzt die Höhe der Liste */
    overflow-y: auto; /* Macht die Liste scrollbar */
}
</style>