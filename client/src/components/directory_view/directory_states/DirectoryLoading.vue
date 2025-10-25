<template>
  <section class='container pt-4 flex justify-center items-center'>
    <span class='loader' />
  </section>

  <!--
  <section class='container pt-4 flex flex-col space-y-3'>
    <Skeleton class='h-[125px] w-[250px] rounded-xl' />
    <div class='space-y-2'>
      <Skeleton class='h-4 w-[250px]' />
      <Skeleton class='h-4 w-[200px]' />
    </div>
  </section>
  -->
</template>

<script
  setup
  lang='ts'
>
</script>

<style>
/* stylelint-disable property-no-vendor-prefix */
@reference '../../../assets/styles/index.css';

.loader {
  --c: no-repeat linear-gradient(var(--color-foreground) 0 0);

  position: relative;

  overflow: hidden;

  aspect-ratio: 1;
  width: 5rem;

  background:
    var(--c) 0 0,
    var(--c) 0 100%,
    var(--c) 50% 0,
    var(--c) 50% 100%,
    var(--c) 100% 0,
    var(--c) 100% 100%;
  background-size: 1rem 50%;

  animation: bars 1s infinite;

  &::before {
    content: '';

    position: absolute;
    top: calc(50% - 0.5rem);
    left: -1rem;

    width: 1rem;
    height: 1rem;
    border-radius: 50%;

    background: var(--color-foreground);

    animation: inherit;
    animation-name: ball;
  }
}

@keyframes bars {
  16.67% {
    background-size: 1rem 30%, 1rem 30%, 1rem 50%, 1rem 50%, 1rem 50%, 1rem 50%;
  }

  33.33% {
    background-size: 1rem 30%, 1rem 30%, 1rem 30%, 1rem 30%, 1rem 50%, 1rem 50%;
  }

  50% {
    background-size: 1rem 30%, 1rem 30%, 1rem 30%, 1rem 30%, 1rem 30%, 1rem 30%;
  }

  66.67% {
    background-size: 1rem 50%, 1rem 50%, 1rem 30%, 1rem 30%, 1rem 30%, 1rem 30%;
  }

  83.33% {
    background-size: 1rem 50%, 1rem 50%, 1rem 50%, 1rem 50%, 1rem 30%, 1rem 30%;
  }
}

@keyframes ball {
  20% {
    left: 0;
  }

  40% {
    left: calc(50% - 0.5rem);
  }

  60% {
    left: calc(100% - 1rem);
  }

  80%,
  100% {
    left: 100%;
  }
}
</style>
