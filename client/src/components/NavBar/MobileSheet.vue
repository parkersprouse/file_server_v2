<!-- eslint-disable vue/no-parsing-error -->
<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant='ghost'
        class='p-1! h-auto'
      >
        <icon-gear-six-fill class='size-6! dark:text-muted-foreground' />
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
          <span class='shrink-0 grow-0 text-md text-muted-foreground font-semibold'>Layout</span>
          <hr class='shrink-0 grow w-auto! p-0! m-0!'>
        </p>
        <ViewToggles />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
          <span class='shrink-0 grow-0 text-md text-muted-foreground font-semibold'>Sort</span>
          <hr class='shrink-0 grow w-auto! p-0! m-0!'>
        </p>
        <SortToggles />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
          <span class='shrink-0 grow-0 text-md text-muted-foreground font-semibold'>Theme</span>
          <hr class='shrink-0 grow w-auto! p-0! m-0!'>
        </p>
        <ThemeToggle />
      </section>
    </SheetContent>
  </Sheet>
</template>
