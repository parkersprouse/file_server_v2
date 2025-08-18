import type {
  ArrowOptions,
  FlipOptions,
  Placement,
  ShiftOptions,
  Strategy,
} from '@floating-ui/dom';

type TooltipPayload = {
  arrow_opts?: Partial<ArrowOptions>;
  flip_opts?: Partial<FlipOptions>;
  placement?: Placement;
  shift_opts?: Partial<ShiftOptions>;
  strategy?: Strategy;
  value: string;
};
