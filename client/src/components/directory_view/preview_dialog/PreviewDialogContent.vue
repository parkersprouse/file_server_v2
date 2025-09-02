<template>
  <div class='preview-dialog__content'>
    <slot name='default' />
  </div>
</template>

<script setup lang='ts'>
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__content {
      @apply flex flex-col flex-nowrap place-content-center z-[1005] px-4
             w-fit h-auto max-w-screen max-h-screen overflow-hidden cursor-pointer self-center;

      & * {
        cursor: initial;
      }

      & object {
        @apply w-full h-full max-w-full max-h-full;
      }

      & media-controller {
        --media-control-background: var(--media-secondary-color, #0e0e15);

        @apply max-w-full max-h-full overflow-hidden;

        @variant hover {
          --media-control-hover-background: #232331;
        }

        & [slot='media'] {
          @apply max-w-full max-h-full;
        }

        & media-control-bar,
        & [slot='centered-chrome'] {
          @apply w-full;

          & [class$='-player__control'] {
            @apply cursor-pointer;
            /* figure out how to not have tailwind override media chrome's styles */
            padding: 0.5rem;

            & * {
              @apply cursor-pointer;
            }

            & svg {
              @apply shrink-0;
            }
          }
        }
      }
    }
  }
}
</style>
