<script setup>
</script>

<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
.v-application {
  background-color: #333333 !important; 
}
.v-main {
  margin: 0 !important; 
  padding-top: 0 !important; 
  border-radius: 0;
  overflow: hidden;
}
</style>