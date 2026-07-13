<template>
  <section class='container'>
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <icon-empty-light class='size-14!' />
        </EmptyMedia>
        <EmptyTitle class='text-xl'>
          {{ $router_store.searching ? "No Results" : "Directory Empty" }}
        </EmptyTitle>
        <EmptyDescription>
          <div class='text-lg!'>
            {{
              $router_store.searching ?
                "Nothing matched your search" :
                "No files were found in the current directory"
            }}
          </div>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </section>
</template>

<script setup lang='ts'>
import { useRouterStore } from 'stores/router.ts';

const $router_store = useRouterStore();
</script>
