<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import barsData from '../data/bars.json'; 

// --- 1. Vue State-Variablen
const selectedBar = ref(null); 
const bars = ref(barsData); 
const drawer = ref(false); 

// Filter-Variablen angepasst an die Eigenschaft "Art"
const activeFilters = ref([]); 
const availableArts = ['Entspannt', 'Cool', 'Chic', 'Extravagant']; 

// NEU: Suchvariablen
const searchInput = ref(''); 
const searchMenu = ref(false); 
const highlightMarker = ref(null); 

let map = null; 
let markers = []; 

const mapStyleUrl = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';


// --- Filter-Logik für Bars
const filteredBars = computed(() => {
    if (activeFilters.value.length === 0) {
        return bars.value;
    }
    return bars.value.filter(bar => 
      bar.Art && bar.Art.some(art => activeFilters.value.includes(art))
    );
});

// NEU: Suchlogik für Bars
const searchedBars = computed(() => {
    if (!searchInput.value) {
        return filteredBars.value; // Zeige alle gefilterten Bars, wenn Suchfeld leer ist
    }
    const searchTerm = searchInput.value.toLowerCase();
    return filteredBars.value.filter(bar => 
        bar.name.toLowerCase().includes(searchTerm)
    );
});


// --- Funktion zum Aktualisieren der Karte und Marker
const updateMapMarkers = () => {
    markers.forEach(marker => marker.remove());
    markers = [];

    filteredBars.value.forEach(bar => { // Marker basieren auf gefilterten Bars
        if (bar.coordinates && bar.coordinates.lat && bar.coordinates.lng) {
            
            // Markerfarbe Lila für Highlight, sonst Orange für Bars
            const markerColor = highlightMarker.value && highlightMarker.value.id === bar.id ? '#ff00ff' : '#ff7f00'; 
            const marker = new maplibregl.Marker({ color: markerColor }) 
                .setLngLat([bar.coordinates.lng, bar.coordinates.lat]) 
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(bar.name))
                .addTo(map);

            marker.getElement().addEventListener('click', () => {
                selectedBar.value = bar; 
                drawer.value = true;
            });
            
            markers.push(marker);
        }
    });
};

// NEU: Funktion zum Springen auf der Karte
const jumpToBar = (bar) => {
    if (map && bar.coordinates) {
        map.flyTo({
            center: [bar.coordinates.lng, bar.coordinates.lat],
            zoom: 16, // Zoomt näher heran
            essential: true 
        });
        selectedBar.value = bar; // Öffnet Sidebar
        drawer.value = true; 
        highlightMarker.value = bar; // Markiert den Marker
        updateMapMarkers(); // Marker aktualisieren, um Highlight zu zeigen
        searchMenu.value = false; // Suchmenü schließen
    }
};


// --- Watcher für den Filter
watch(activeFilters, () => {
    if (map) {
        updateMapMarkers();
    }
}, { deep: true });


// --- Funktion zur Initialisierung der Karte und Marker (INIT)
const initMap = (lat, lng, zoom = 15) => {
    map = new maplibregl.Map({
        container: 'map-bar-container', 
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

        <v-list class="pa-2" :bg-color="activeFilters.length > 0 ? 'orange-lighten-4' : 'white'">
            <v-list-item-title class="pa-2 font-weight-bold text-black">Art filtern:</v-list-item-title>
            <v-divider></v-divider>
            <v-list-item
                v-for="art in availableArts"
                :key="art"
                density="compact"
            >
                <v-checkbox
                    v-model="activeFilters"
                    :label="art"
                    :value="art"
                    hide-details
                    class="ml-2"
                    density="compact"
                    color="orange"
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
                label="Bar suchen..."
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
                    v-for="bar in searchedBars"
                    :key="bar.id"
                    @click="jumpToBar(bar)"
                    link
                >
                    <v-list-item-title>{{ bar.name }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="searchedBars.length === 0">
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
        <v-card v-if="selectedBar" class="pa-4" color="#FFFFFF" flat rounded="lg"> 
            <v-card-title class="text-h5 text-black">{{ selectedBar.name }}</v-card-title>
            
            <v-chip 
                color="orange-lighten-1" 
                class="ma-2" 
                label
            >
                <v-icon start icon="mdi-tag"></v-icon>
                Art: {{ selectedBar.Art ? selectedBar.Art.join(', ') : 'N/A' }}
            </v-chip>

            <v-divider class="my-3"></v-divider>

            <v-list density="compact" bg-color="#FFFFFF" class="text-black">
                <v-list-item prepend-icon="mdi-clock-time-four-outline" :title="`Öffnungszeiten: ${selectedBar.opening_hours}`" class="text-black"></v-list-item>
                <v-list-item prepend-icon="mdi-account-search" :title="`Altersstruktur: ${selectedBar.age_structure}`" class="text-black"></v-list-item>
                <v-list-item prepend-icon="mdi-subway" :title="`ÖPNV: ${selectedBar.public_transport && selectedBar.public_transport.length > 0 ? selectedBar.public_transport.join(', ') : 'Keine Angabe'}`" class="text-black"></v-list-item>
                <v-list-item prepend-icon="mdi-train" :title="`Nächster Bahnhof: ${selectedBar.next_train_station || 'N/A'}`" class="text-black"></v-list-item>
                <v-list-item prepend-icon="mdi-information-outline" :title="`Beschreibung: ${selectedBar.description}`" class="text-black"></v-list-item>
            </v-list>

        </v-card>
        <v-card v-else class="pa-4" flat color="#FFFFFF" rounded="lg">
            <v-card-title class="text-black">Wähle eine Bar auf der Karte aus.</v-card-title>
        </v-card>
    </v-navigation-drawer>

    <div id="map-bar-container"></div> 
</div>
</template>

<style scoped>
#map-bar-container { 
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

/* Styling für den Such-Button (wie bei ClubMap.vue) */
.search-fab {
    position: absolute;
    top: 144px; /* Platziert ihn unter dem Filter-Button */
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