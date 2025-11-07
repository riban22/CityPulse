<!-- src/App.vue -->
<script setup>
</script>

<template>
  <v-app>
    <v-app-bar 
  app 
  color="#EBEBEB" 
  elevation="1" 
  density="compact" 
>
  <v-toolbar-title class="text-black text-subtitle-1 font-weight-light ml-4 mr-6">
    CityPulse
  </v-toolbar-title>

  <v-menu open-on-hover>
    <template v-slot:activator="{ props }">
      <v-btn 
        v-bind="props" 
        class="text-black" 
        variant="plain" 
        size="small" 
      >
        CityPulse Map
        <v-icon right size="small" icon="mdi-chevron-down"></v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item to="/">
        <v-list-item-title>Clubs</v-list-item-title>
      </v-list-item>
      <v-list-item to="/bars">
        <v-list-item-title>Bars</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <v-btn 
    to="/events" 
    class="text-black" 
    variant="plain" 
    size="small" 
  >
    Events
  </v-btn>

  <v-spacer></v-spacer> 

</v-app-bar>

    <v-main>
      <router-view />
    </v-main>

  </v-app>
</template>

<style scoped>
/* 1. Setzt den HINTERGRUND der gesamten Anwendung auf das helle Silber-Grau */
.v-application {
  background-color: #EBEBEB !important; 
}

/* 2. Entfernt alle Ränder des Hauptinhalts */
.v-main {
  margin: 0 !important; /* WICHTIG: Entfernt den äußeren Rand */
  padding-top: 0 !important; /* Wird von der App Bar selbst gesteuert */
  border-radius: 0;
  overflow: hidden;
}
/* Die Filter-Bar wird nicht mehr hier im App.vue-Style definiert, da sie in ClubMap.vue liegt */
</style>