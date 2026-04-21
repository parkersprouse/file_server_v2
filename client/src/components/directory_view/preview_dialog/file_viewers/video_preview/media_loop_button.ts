import { MediaChromeButton } from 'media-chrome';

const ATTR_NAME = 'medialooping';

const on_icon = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 4H21C21.5523 4 22 4.44772 22 5V12H20V6H6V9L1 5L6 1V4ZM18 20H3C2.44772 20 2 19.5523 2 19V12H4V18H18V15L23 19L18 23V20Z"/>
</svg>`;

const off_icon = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" xml:space="preserve" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 24 24">
  <path fill-rule="nonzero" d="M6 4h15a1 1 0 0 1 1 1v7h-2V6H6v3L1 5l5-4zm12 16H3a1 1 0 0 1-1-1v-7h2v6h14v-3l5 4-5 4z"/>
  <path fill-rule="nonzero" d="m12 10.94 3.71-3.71 1.06 1.06L13.06 12l3.71 3.71-1.06 1.06-3.71-3.7-3.71 3.7-1.06-1.06 3.71-3.7-3.71-3.72 1.06-1.06z"/>
</svg>`;

function getSlotTemplateHTML(_attrs: Record<string, string>): string {
  return /* html*/ `
    <style>
      :host([${ATTR_NAME}]) slot[name=icon] slot[name=off] {
        display: none !important;
      }

      ${/* Double negative, but safer if display doesn't equal 'block' */ ''}
      :host(:not([${ATTR_NAME}])) slot[name=icon] slot[name=on] {
        display: none !important;
      }

      :host([${ATTR_NAME}]) slot[name=tooltip-enable],
      :host(:not([${ATTR_NAME}])) slot[name=tooltip-disable] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="off">${off_icon}</slot>
      <slot name="on">${on_icon}</slot>
    </slot>
  `;
}

function getTooltipContentHTML(): string {
  return /* html */ `
    <slot name="tooltip-enable">Enable Looping</slot>
    <slot name="tooltip-disable">Disable Looping</slot>
  `;
}

function updateAriaChecked(el: MediaLoopToggleButton): void {
  el.setAttribute('aria-checked', String(el.mediaLooping));
}

function updateAriaLabel(el: MediaLoopToggleButton): void {
  const label = el.mediaLooping ? 'disable looping' : 'enable looping';
  el.setAttribute('aria-label', label);
};

/**
 * @slot on - An element shown when looping is enabled for the media.
 * @slot off - An element shown when looping is disabled for the media.
 * @slot icon - An element for representing all states in a single icon.
 *
 * @attr {boolean} medialooping - (read-only) Present when the media is set to loop.
 *
 * @cssproperty [--media-loop-toggle-button-display = inline-flex] - `display` property of button.
 */
class MediaLoopToggleButton extends MediaChromeButton {
  static getSlotTemplateHTML = getSlotTemplateHTML;
  static getTooltipContentHTML = getTooltipContentHTML;

  static get observedAttributes(): string[] {
    return [...super.observedAttributes, ATTR_NAME];
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'switch');
    updateAriaChecked(this);
    updateAriaLabel(this);
  }

  attributeChangedCallback(
    attrName: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(attrName, oldValue, newValue);

    if (attrName === ATTR_NAME) {
      updateAriaChecked(this);
      updateAriaLabel(this);
    }
  }

  /**
   * @type {boolean}
   */
  get mediaLooping(): boolean {
    return this.hasAttribute('medialooping');
  }

  set mediaLooping(value: boolean) {
    this.toggleAttribute('medialooping', value);
  }

  handleClick(): void {
    this.mediaLooping = !this.mediaLooping;
    this.dispatchEvent(new globalThis.CustomEvent('mediatogglelooprequest', {
      bubbles: true,
      composed: true,
    }));
  }
}

if (!globalThis.customElements.get('media-loop-toggle-button')) {
  globalThis.customElements.define('media-loop-toggle-button', MediaLoopToggleButton);
}

export default MediaLoopToggleButton;
