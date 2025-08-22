import type { Component, HTMLAttributes } from 'vue';

export type PreviewTypeAttrs = {
  class?: HTMLAttributes['class'];
  type: Component;
};
