/*
 * The `<template>`s Video.js clones per radio-group option (`skin.html` in the
 * registry), shared so the two players' menus stay in step. They're bound with
 * `v-html`: a Vue-rendered `<template>` would leave its children outside
 * `.content`, so the menus would come up empty.
 */
const ITEM_INDICATOR = `<media-menu-item-indicator force-mount class="media-menu-item-indicator">
  <media-icon family="neutral" name="check" class="media-menu-radio-item-icon"></media-icon>
</media-menu-item-indicator>`;

// A plain label (speed, audio track).
export const RADIO_ITEM_TEMPLATE = `<template>
  <media-menu-radio-item class="media-menu-radio-item">
    <span data-part="label"></span>
    ${ITEM_INDICATOR}
  </media-menu-radio-item>
</template>`;

// Quality: a label with a superscript tier and a badge.
export const QUALITY_ITEM_TEMPLATE = `<template>
  <media-menu-radio-item class="media-menu-radio-item">
    <span><span data-part="label"></span><sup data-part="tier" class="media-menu-tier"></sup></span>
    <span data-part="badge" class="media-menu-badge"></span>
    ${ITEM_INDICATOR}
  </media-menu-radio-item>
</template>`;
