import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  'gap-1.5 rounded-none border border-transparent bg-clip-padding px-2 py-0.5 text-xs font-medium tracking-wide transition-colors has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20 dark:[a]:hover:bg-destructive/30',
        outline: 'border-border text-foreground [a]:hover:bg-muted',
        ghost: 'border-0 px-0 py-0 text-muted-foreground hover:text-foreground',
        link: 'border-0 px-0 py-0 text-foreground underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
