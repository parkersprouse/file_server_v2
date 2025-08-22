import type { Component, SetupContext } from 'vue';

export type FileTypeAttrs = {
  actions?: {
    class?: string;
    end?: Component | Component[];
    start?: Component | Component[];
  };
  content?: {
    bindings?: {
      [index: string]: SetupContext['attrs'];
    };
    class?: string;
  };
  wrapper?: {
    class?: string;
  };
};
