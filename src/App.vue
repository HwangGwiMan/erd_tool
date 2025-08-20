<script setup lang="ts">
import ERDCanvas from './components/ERDCanvas.vue'
</script>

<template>
  <div id="app">
    <ERDCanvas />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}

#app {
  height: 100vh;
  overflow: hidden;
}
</style>
