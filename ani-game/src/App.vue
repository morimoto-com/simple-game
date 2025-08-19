<template>
  <div class="app-shell">
    <header class="app-header">
      <h1 class="brand">Engineer Hub – Mini Games</h1>
      <nav>
        <RouterLink to="/">Home</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <small>© 2025 shimori</small>
    </footer>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #0f1221;
  color: #eef1ff;
}
.app-header,
.app-footer {
  padding: 12px 16px;
  border-bottom: 1px solid #28304a;
}
.app-footer {
  border-top: 1px solid #28304a;
  border-bottom: none;
}
.brand {
  margin: 0 0 6px;
  font-size: 1.25rem;
  letter-spacing: 0.5px;
}
.app-main {
  padding: 16px;
}
a {
  color: #a9c1ff;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style>
