<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant='ghost'
        class='p-1! h-auto ghost-ext'
      >
        <icon-list class='size-8!' />
      </Button>
    </SheetTrigger>

    <SheetContent
      class='h-auto'
      side='top'
    >
      <SheetHeader>
        <SheetTitle />
      </SheetHeader>

      <section class='flex flex-col flex-nowrap justify-evenly items-center h-full px-4 pb-4'>
        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 pt-0 pb-2'>
          <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
            Layout
          </span>
          <Separator
            orientation='horizontal'
            class='shrink-0 grow w-auto! border-zinc-300 dark:border-zinc-700'
          />
        </p>
        <ViewToggles />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
          <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
            Sort
          </span>
          <Separator
            orientation='horizontal'
            class='shrink-0 grow w-auto! border-zinc-300 dark:border-zinc-700'
          />
        </p>
        <SortToggles />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
          <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
            Theme
          </span>
          <Separator
            orientation='horizontal'
            class='shrink-0 grow w-auto! border-zinc-300 dark:border-zinc-700'
          />
        </p>
        <ThemeToggle />
      </section>
    </SheetContent>
  </Sheet>
</template>
