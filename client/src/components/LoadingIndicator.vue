<template>
  <span class='loader' />
</template>

<script setup lang='ts'>
</script>

<style>
@reference '../assets/styles/index.css';

.loader {
  position: relative;

  display: inline-block;

  box-sizing: border-box;
  width: 48px;
  height: 48px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;

  animation: rotation 1s linear infinite;

  &::after {
    content: '';

    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);

    box-sizing: border-box;
    width: 3px;
    height: 24px;

    @apply bg-cerise-red-500 dark:bg-cerise-red-600;
  }
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
