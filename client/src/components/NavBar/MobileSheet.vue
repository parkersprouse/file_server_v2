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
        <p class='text-md text-muted-foreground font-semibold self-start pb-2'>Layout</p>
        <ViewToggles />

        <p class='text-md text-muted-foreground font-semibold self-start pt-6 pb-2'>Sort</p>
        <SortSelect class='w-full' />

        <p class='text-md text-muted-foreground font-semibold self-start pt-6 pb-2'>Theme</p>
        <ThemeToggle />
      </section>
    </SheetContent>
  </Sheet>
</template>
