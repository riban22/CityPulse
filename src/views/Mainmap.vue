<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import clubsData from '../data/clubs.json'; 
import barsData from '../data/bars.json'; 
import eventsData from '../data/events.json'; 

// Variable: center (Das ist dein User-Standort)
// Variable: selectedLocation (Das ist der Club, den man angeklickt hat)

// --- Google Maps URL ---
const googleMapsUrl = computed(() => {
  // Sicherheitscheck: Ohne Club-Koordinaten geht nichts
  if (!selectedLocation.value?.coordinates) return undefined;

  const destLat = selectedLocation.value.coordinates.lat;
  const destLng = selectedLocation.value.coordinates.lng;

  let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=transit`;

  // Startpunkt anhängen (falls vorhanden)
  try {
    if (center.value) {
      let startLat, startLng;
      // MapLibre Format [lng, lat]
      if (Array.isArray(center.value) && center.value.length >= 2) {
        startLng = center.value[0];
        startLat = center.value[1];
      } 
      // Objekt Format { lat, lng }
      else if (center.value.lat) {
        startLat = center.value.lat;
        startLng = center.value.lng;
      }

      if (startLat && startLng) {
        url += `&origin=${startLat},${startLng}`;
      }
    }
  } catch (e) {
    // Fehler beim Startpunkt ignorieren, Link funktioniert trotzdem
  }
  return url;
});

// --- Apple Maps URL ---
const appleMapsUrl = computed(() => {
  // Sicherheitscheck
  if (!selectedLocation.value?.coordinates) return undefined;

  const destLat = selectedLocation.value.coordinates.lat;
  const destLng = selectedLocation.value.coordinates.lng;

  // Basis-URL (funktioniert immer)
  // daddr = Destination Address (Ziel)
  // dirflg=r = Public Transport (Öffis)
  let url = `http://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=r`;

  // Startpunkt anhängen (falls vorhanden)
  try {
    if (center.value) {
      let startLat, startLng;
      if (Array.isArray(center.value) && center.value.length >= 2) {
        startLng = center.value[0];
        startLat = center.value[1];
      } else if (center.value.lat) {
        startLat = center.value.lat;
        startLng = center.value.lng;
      }

      // saddr = Source Address (Start)
      if (startLat && startLng) {
        url += `&saddr=${startLat},${startLng}`;
      }
    }
  } catch (e) {
    // Fehler ignorieren
  }
  return url;
});
// --- DATEN ---
const allLocations = [
    ...clubsData.map(c => ({ ...c, category: 'Club' })),
    ...barsData.map(b => ({ ...b, category: 'Bar' }))
];
const events = ref(eventsData);

// --- STATE ---
const selectedLocation = ref(null); 
const drawer = ref(false); 
const searchInput = ref(''); 
const searchMenu = ref(false); 
const highlightMarker = ref(null); 
const showEvents = ref(false); 

// Filter
const categoryFilter = ref('Alle'); 
const subFilter = ref([]); 
const categories = ['Alle', 'Club', 'Bar'];
const clubGenres = ['Techno', 'House', 'Hip Hop', 'Electro', 'R&B', 'PoP', 'Jazz', 'Rock'];
const barArts = ['Entspannt', 'Cool', 'Chic', 'Extravagant', 'Cocktail Bar'];

let map = null; 
let markers = []; 
const mapStyleUrl = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

// --- LOGIK ---
const sortedFutureEvents = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parseDate = (d) => { const p = d.split('-'); return new Date(p[0], p[1]-1, p[2]); };
  return events.value.filter(e => parseDate(e.date) >= today).sort((a, b) => parseDate(a.date) - parseDate(b.date));
});

const formatDate = (dateString) => {
  const parts = dateString.split('-');
  return new Date(parts[0], parts[1]-1, parts[2]).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

// UI Berechnung: Verschiebung nach unten (Header 48px + Panel 260px = 308px)
const topOffset = computed(() => showEvents.value ? 308 : 48); 

const filteredLocations = computed(() => {
    let result = allLocations;
    if (categoryFilter.value !== 'Alle') {
        result = result.filter(loc => loc.category === categoryFilter.value);
        if (subFilter.value.length > 0) {
            if (categoryFilter.value === 'Club') result = result.filter(loc => loc.music && loc.music.some(g => subFilter.value.includes(g)));
            else if (categoryFilter.value === 'Bar') result = result.filter(loc => (loc.Art && loc.Art.some(a => subFilter.value.includes(a))) || (loc.type && subFilter.value.includes(loc.type)));
        }
    }
    if (searchInput.value) result = result.filter(loc => loc.name.toLowerCase().includes(searchInput.value.toLowerCase()));
    return result;
});

const updateMapMarkers = () => {
    markers.forEach(marker => marker.remove());
    markers = [];
    filteredLocations.value.forEach(loc => {
        if (loc.coordinates) {
            const isHighlighted = highlightMarker.value && highlightMarker.value.id === loc.id;
            let color = isHighlighted ? '#ff00ff' : (loc.category === 'Club' ? '#00ffff' : '#ff7f00'); 
            const marker = new maplibregl.Marker({ color: color })
                .setLngLat([loc.coordinates.lng, loc.coordinates.lat]) 
                .setPopup(new maplibregl.Popup({ offset: 25 }).setText(loc.name))
                .addTo(map);
            marker.getElement().style.cursor = 'pointer';
            marker.getElement().addEventListener('click', () => {
                selectedLocation.value = loc;
                drawer.value = true;
                highlightMarker.value = loc;
                updateMapMarkers(); 
            });
            markers.push(marker);
        }
    });
};

const jumpToLocation = (loc) => {
    if (map && loc.coordinates) {
        map.flyTo({ center: [loc.coordinates.lng, loc.coordinates.lat], zoom: 16 });
        selectedLocation.value = loc;
        drawer.value = true; 
        highlightMarker.value = loc;
        updateMapMarkers(); 
        searchMenu.value = false;
    }
};

watch([categoryFilter, subFilter], () => { if (map) updateMapMarkers(); });
watch(categoryFilter, () => { subFilter.value = []; });

const initMap = (lat, lng, zoom = 15) => {
    map = new maplibregl.Map({ container: 'map-container', style: mapStyleUrl, center: [lng, lat], zoom: zoom });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    new maplibregl.Marker({ color: '#ff0000' }).setLngLat([lng, lat]).setPopup(new maplibregl.Popup().setText('Dein Standort')).addTo(map);
    updateMapMarkers();
};

onMounted(() => {
    const munichCenter = { lat: 48.1351, lng: 11.5820 }; 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => initMap(pos.coords.latitude, pos.coords.longitude, 15),
            (err) => initMap(munichCenter.lat, munichCenter.lng, 13)
        );
    } else { initMap(munichCenter.lat, munichCenter.lng, 13); }
});
</script>

<template>
  <div class="main-wrapper">
    
    <v-app-bar absolute color="#1e1e1e" elevation="4" density="compact" style="z-index: 1005;">
      <v-toolbar-title class="text-white text-subtitle-1 font-weight-light ml-4">
        CityPulse
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn 
        @click="showEvents = !showEvents" 
        :color="showEvents ? 'cyan-accent-2' : 'white'" 
        variant="text" 
        prepend-icon="mdi-calendar-star"
      >
        Events
      </v-btn>
    </v-app-bar>

    <div class="events-panel-container" :class="{ 'panel-open': showEvents }">
        <div class="d-flex align-center px-4 pt-3 pb-2">
            <span class="text-h6 text-white font-weight-bold">Upcoming Events</span>
            <v-chip size="small" color="red" class="ml-3" variant="flat">Live</v-chip>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" color="grey" @click="showEvents = false"></v-btn>
        </div>
        
        <v-slide-group class="pa-2" show-arrows>
            <v-slide-group-item v-for="event in sortedFutureEvents" :key="event.id">
                <v-card width="240" color="#2c2c2c" class="ma-2 rounded-lg elevation-4 event-card" link>
                    <v-img height="100" cover src="https://cdn.vuetifyjs.com/images/cards/concert.jpg" class="align-end">
                        <div class="date-badge">{{ formatDate(event.date) }}</div>
                    </v-img>
                    <v-card-text class="pa-3">
                        <div class="text-subtitle-2 font-weight-bold text-white text-truncate mb-1">{{ event.title }}</div>
                        <div class="d-flex align-center text-caption text-grey-lighten-1">
                            <v-icon size="x-small" class="mr-1" color="cyan">mdi-map-marker</v-icon>
                            <span class="text-truncate">{{ event.location }}</span>
                        </div>
                    </v-card-text>
                </v-card>
            </v-slide-group-item>
        </v-slide-group>
    </div>

    <div class="filter-bar-wrapper" :class="{ 'bar-shifted': showEvents }">
        <v-toolbar color="transparent" density="compact" elevation="0" class="rounded-0 pl-2">
            <v-sheet color="#1e1e1e" class="rounded-xl d-flex align-center pa-1 elevation-4">
                <v-btn-toggle v-model="categoryFilter" mandatory density="compact" class="mr-2" color="white" variant="text" rounded="xl">
                    <v-btn value="Alle" class="text-grey-lighten-1" size="small">Alle</v-btn>
                    <v-btn value="Club" class="text-grey-lighten-1" size="small">Clubs</v-btn>
                    <v-btn value="Bar" class="text-grey-lighten-1" size="small">Bars</v-btn>
                </v-btn-toggle>
                <v-divider vertical class="mx-1" color="grey"></v-divider>
                <v-chip-group v-if="categoryFilter === 'Club'" v-model="subFilter" multiple selected-class="text-cyan-accent-2" class="ml-2">
                    <v-chip v-for="g in clubGenres" :key="g" :value="g" size="small" class="text-white">{{ g }}</v-chip>
                </v-chip-group>
                <v-chip-group v-if="categoryFilter === 'Bar'" v-model="subFilter" multiple selected-class="text-orange-accent-2" class="ml-2">
                    <v-chip v-for="a in barArts" :key="a" :value="a" size="small" class="text-white">{{ a }}</v-chip>
                </v-chip-group>
            </v-sheet>
        </v-toolbar>
    </div>

    <v-menu v-model="searchMenu" offset-y :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn 
                v-bind="props" 
                icon="mdi-magnify" 
                size="large" 
                color="#1e1e1e" 
                theme="dark" 
                elevation="5" 
                class="search-fab" 
                :class="{ 'fab-shifted': showEvents }"
            ></v-btn>
        </template>
        <v-card class="pa-2" width="300" theme="dark">
            <v-text-field v-model="searchInput" label="Location suchen..." variant="outlined" density="compact" hide-details clearable autofocus></v-text-field>
            <v-list dense class="scrollable-list" theme="dark">
                <v-list-item v-for="loc in filteredLocations" :key="loc.id" @click="jumpToLocation(loc)" link>
                    <v-list-item-title>{{ loc.name }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">{{ loc.category }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card>
    </v-menu>

    <v-navigation-drawer v-model="drawer" temporary width="350" color="#1e1e1e" location="right" style="z-index: 2000;" elevation="5">

<div class="mt-4" v-if="selectedLocation">
  
  <v-btn
    block
    color="blue-darken-1"
    variant="tonal"
    prepend-icon="mdi-google-maps"
    :href="googleMapsUrl"
    target="_blank"
    class="mb-2" 
  >
    Google Maps
  </v-btn>

  <v-btn
    block
    color="blue-darken-1"
    variant="tonal"
    prepend-icon="mdi-apple"
    :href="appleMapsUrl"
    target="_blank"
  >
    Apple Maps
  </v-btn>
  
</div>
    <v-card v-if="selectedLocation" class="pa-4" color="transparent" flat> 
        <v-card-title class="text-h5 text-white font-weight-bold">{{ selectedLocation.name }}</v-card-title>
        
        <v-chip :color="selectedLocation.category === 'Club' ? 'cyan' : 'orange'" class="ma-2" label size="small">
            <v-icon start size="small" :icon="selectedLocation.category === 'Club' ? 'mdi-music' : 'mdi-glass-cocktail'"></v-icon> {{ selectedLocation.category }}
        </v-chip>

        <v-chip v-if="selectedLocation.category === 'Club'" :color="selectedLocation.capacity_simulated === 'High' ? 'red' : 'green'" class="ma-2" label size="small">
            Füllstand: {{ selectedLocation.capacity_simulated || 'N/A' }}
        </v-chip>

        <v-divider class="my-3" color="grey"></v-divider>

        <v-list density="compact" bg-color="transparent" class="text-grey-lighten-1">
            <v-list-item v-if="selectedLocation.category === 'Club'" prepend-icon="mdi-music-note" :title="`Musik: ${selectedLocation.music ? selectedLocation.music.join(', ') : 'N/A'}`"></v-list-item>
            <v-list-item v-else prepend-icon="mdi-tag" :title="`Art: ${selectedLocation.Art ? selectedLocation.Art.join(', ') : 'N/A'}`"></v-list-item>

            <v-list-item prepend-icon="mdi-account-multiple">
    <div class="wrap-text text-grey-lighten-1">
        Clientèle: {{ selectedLocation.clientele || 'N/A' }}
    </div>
</v-list-item>
            <v-list-item prepend-icon="mdi-account-search" :title="`Alter: ${selectedLocation.age_structure || 'N/A'}`"></v-list-item>

            <v-list-item prepend-icon="mdi-clock">
    <div class="wrap-text text-grey-lighten-1">
        Öffnungszeiten: {{ selectedLocation.opening_hours || 'N/A' }}
    </div>
</v-list-item>

            <v-list-item prepend-icon="mdi-train-car">
    <div class="wrap-text text-grey-lighten-1">
        Anbindung: {{ selectedLocation.public_transport ? selectedLocation.public_transport.join(', ') : 'N/A' }}
    </div>
</v-list-item>
            <v-list-item prepend-icon="mdi-map-marker-radius" :title="`Station: ${selectedLocation.next_station || 'N/A'}`"></v-list-item>

            <v-divider class="my-3" color="grey"></v-divider>

            <div class="pa-2 text-caption text-grey-lighten-1">
                <div class="font-weight-bold mb-1 text-uppercase">Beschreibung:</div>
                {{ selectedLocation.description || 'Keine Beschreibung verfügbar.' }}
            </div>
        </v-list>
    </v-card>
</v-navigation-drawer>

    <div id="map-container"></div>
  </div>
</template>

<style scoped>

    /* src/views/MainMap.vue - im <style scoped> Bereich hinzufügen */

/* Verschiebt die Zoom-Buttons (oben rechts) unter den Header */
:deep(.maplibregl-ctrl-top-right) {
    margin-top: 55px !important; /* 48px Header + 7px Abstand */
    z-index: 1001 !important; /* Sicherstellen, dass sie klickbar bleiben */
}
#map-container { height: 100vh; width: 100%; position: absolute; top: 0; left: 0; }

/* EVENTS PANEL: Höhe erhöht auf 260px */
.events-panel-container {
    position: absolute;
    top: 48px; 
    left: 0;
    width: 100%;
    height: 0;
    opacity: 0;
    overflow: hidden; 
    z-index: 1003; /* Über dem Filter */
    background: rgba(18, 18, 18, 0.95); 
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #333;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.events-panel-container.panel-open {
    height: 260px; /* Mehr Platz für Karten */
    opacity: 1;
}

/* FILTER BAR: Rutscht weiter runter (auf 308px) */
.filter-bar-wrapper {
    position: absolute;
    left: 0;
    width: 100%;
    z-index: 1000;
    top: 48px;
    transition: top 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    pointer-events: none;
}
.filter-bar-wrapper > * { pointer-events: auto; }

.filter-bar-wrapper.bar-shifted {
    top: 308px; /* 48px + 260px */
}

/* SUCHE: Rutscht weiter runter (auf 370px) */
.search-fab {
    position: absolute;
    left: 16px; 
    z-index: 1000;
    border-radius: 50%; 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    top: 110px; 
    transition: top 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.search-fab.fab-shifted {
    top: 370px; /* 110px + 260px */
}

.date-badge {
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 2px 8px;
    font-weight: bold;
    font-size: 0.8rem;
    position: absolute;
    top: 8px;
    left: 8px;
    border-radius: 4px;
}
.event-card { transition: transform 0.2s; border: 1px solid #333; }
.event-card:hover { transform: translateY(-2px); border-color: #555; }
.scrollable-list { max-height: 200px; overflow-y: auto; }

.wrap-text {
    white-space: normal !important; /* Verhindert das Abschneiden (...) */
    word-wrap: break-word;          /* Bricht lange Wörter um */
    display: block;
    line-height: 1.5;               /* Etwas mehr Zeilenabstand für bessere Lesbarkeit */
}

/* Sorgt dafür, dass die List-Items in der Sidebar flexibel hoch werden */
:deep(.v-list-item-title) {
    white-space: normal !important;
}
</style>

