<script setup>
import { ref, computed } from 'vue';
import eventsData from '../data/events.json'; // Korrekter Pfad zur events.json

// Events Daten aus der JSON
const events = ref(eventsData);

// Hilfsfunktion zum Erstellen von Date-Objekten für korrekte Vergleiche
const dateStringToDate = (dateString) => {
  // Nimmt den String "YYYY-MM-DD" und erstellt ein Date-Objekt am Anfang des Tages
  const parts = dateString.split('-');
  // Monat ist 0-basiert (zweiter Parameter)
  return new Date(parts[0], parts[1] - 1, parts[2]); 
};

// Computed Property für die sortierten und gefilterten zukünftigen Events
const sortedFutureEvents = computed(() => {
  const today = new Date();
  // Setze die Uhrzeit auf Mitternacht, um Events am aktuellen Tag einzuschließen
  today.setHours(0, 0, 0, 0);

  // 1. Filtern: Nur Events, die heute oder in der Zukunft liegen
  const futureEvents = events.value.filter(event => {
    const eventDate = dateStringToDate(event.date);
    return eventDate.getTime() >= today.getTime();
  });

  // 2. Sortieren: Nach Datum aufsteigend
  futureEvents.sort((a, b) => {
    const dateA = dateStringToDate(a.date);
    const dateB = dateStringToDate(b.date);
    return dateA - dateB;
  });

  return futureEvents;
});

// Funktion zur besseren deutschen Darstellung des Datums
const formatDate = (dateString) => {
  const date = dateStringToDate(dateString);
  return date.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper zur Bestimmung, ob ein Event heute stattfindet
const isToday = (dateString) => {
  const eventDate = dateStringToDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate.getTime() === today.getTime();
}
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-4 text-white">Bevorstehende Events (Nach Datum)</h1>
    
    <v-alert
        v-if="sortedFutureEvents.length === 0"
        type="info"
        variant="tonal"
        class="mt-4"
    >
        Aktuell sind keine zukünftigen Events geplant.
    </v-alert>

    <v-expansion-panels v-else variant="popout" class="mt-4">
      <v-expansion-panel
        v-for="event in sortedFutureEvents"
        :key="event.id"
      >
        <v-expansion-panel-title class="py-4">
          <div class="d-flex align-center justify-space-between w-100">
            <div>
              <span class="text-subtitle-1 font-weight-bold">{{ event.title }}</span>
              <v-chip 
                v-if="isToday(event.date)" 
                color="red" 
                size="small" 
                class="ml-3"
              >
                Heute
              </v-chip>
            </div>
            
            <div class="text-right d-flex align-center text-caption text-grey-darken-1">
                <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                {{ formatDate(event.date) }} 
                <span class="ml-2 mr-1">|</span>
                <v-icon size="small" class="mr-1">mdi-clock-time-four-outline</v-icon>
                {{ event.time }}
            </div>
          </div>
        </v-expansion-panel-title>
        
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-map-marker</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">Ort</v-list-item-title>
              <v-list-item-subtitle>{{ event.location }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-label</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">Kategorie</v-list-item-title>
              <v-list-item-subtitle>{{ event.category }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-text-box-outline</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">Beschreibung</v-list-item-title>
              <v-list-item-subtitle>{{ event.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<style scoped>
/* Stellt sicher, dass der Titel in der Expansion-Panel-Title zentriert bleibt */
.w-100 {
    width: 100%;
}
</style>