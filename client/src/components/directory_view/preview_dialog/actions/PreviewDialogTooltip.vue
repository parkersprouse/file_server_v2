<template>
  <Tooltip
    :delay-duration='250'
    :disable-closing-trigger='true'
    :disable-hoverable-content='true'
    :skip-delay-duration='300'
  >
    <TooltipTrigger as-child>
      <slot name='default' />
    </TooltipTrigger>
    <TooltipContent
      side='bottom'
      to='.preview-dialog__actions'
    >
      <div class='text-center'>
        <slot name='content' />
      </div>
    </TooltipContent>
  </Tooltip>
</template>
