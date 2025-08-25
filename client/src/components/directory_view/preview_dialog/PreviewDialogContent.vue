<template>
  <div class='preview-dialog__wrapper'>
    <div class='preview-dialog__content'>
      <slot name='default' />
    </div>
  </div>
</template>

<script setup lang='ts'>
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__wrapper {
      @apply flex flex-col flex-nowrap items-center justify-center max-w-screen max-h-screen h-auto w-auto;

      & .preview-dialog__content {
        @apply flex flex-row flex-nowrap items-center justify-center z-[1005]
               w-auto h-auto max-w-full max-h-full overflow-auto cursor-auto;

        & object {
          @apply w-full h-full max-w-full max-h-full;
        }
      }
    }
  }
}
</style>
