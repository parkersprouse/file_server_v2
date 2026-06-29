/**
 * Custom Shiki transformers that reproduce the two Prism plugin features Shiki
 * has no built-in equivalent for: inline CSS color swatches and clickable URL
 * autolinking.
 *
 * Both operate in Shiki's `line` hook, which hands us one `<span class="line">`
 * hast element at a time. We walk that line's leaf text nodes and rewrite them
 * in place. Because Shiki tokenises each token as `<span><text/></span>`, every
 * text leaf has its own dedicated parent span — so edits to one leaf never shift
 * the child indices of another, and we can process leaves independently.
 */

import type { Element, ElementContent, Text } from 'hast';
import type { ShikiTransformer } from 'shiki';

interface TextLeaf {
  node: Text;
  parent: Element;
  index: number;
  // Offsets of this leaf's text within the whole line's concatenated text.
  start: number;
  end: number;
}

interface Match {
  index: number;
  length: number;
  value: string;
}

// Recursively collect a line's leaf text nodes in document order, tracking each
// node's parent, position, and offset into the line's concatenated text.
function collectTextLeaves(line: Element): {
  leaves: TextLeaf[];
  text: string;
} {
  const leaves: TextLeaf[] = [];
  let text = '';

  const walk = (parent: Element): void => {
    for (const [index, child] of parent.children.entries()) {
      if (child.type === 'text') {
        const start = text.length;
        text += child.value;
        leaves.push({
          end: text.length,
          index,
          node: child,
          parent,
          start,
        });
      } else if (child.type === 'element') {
        walk(child);
      }
    }
  };

  walk(line);
  return {
    leaves,
    text,
  };
}

// Drop matches that overlap an earlier (already-accepted) match so we never emit
// two swatches/links for the same span of text.
function dropOverlaps(matches: Match[]): Match[] {
  const sorted = [...matches].sort((a, b) => a.index - b.index || b.length - a.length);
  const out: Match[] = [];
  let consumed_to = -1;
  for (const m of sorted) {
    if (m.index >= consumed_to) {
      out.push(m);
      consumed_to = m.index + m.length;
    }
  }
  return out;
}

// Rebuild a single leaf's text into an interleaved sequence of text nodes and
// generated elements, then splice it back into the parent in one operation.
// `makeNode` returns the element to emit for a match; `replace` controls whether
// that element stands in for the matched text (autolink) or sits before it while
// the original text is kept (color swatch).
function rewriteLeaf(
  leaf: TextLeaf,
  matches: Match[],
  makeNode: (match: Match) => Element,
  replace: boolean,
): void {
  const ordered = matches.sort((a, b) => a.index - b.index);
  const value = leaf.node.value;
  const pieces: ElementContent[] = [];
  let cursor = 0;

  for (const m of ordered) {
    const offset = m.index - leaf.start;
    if (offset > cursor) {
      pieces.push({
        type: 'text',
        value: value.slice(cursor, offset),
      });
    }
    pieces.push(makeNode(m));
    if (replace) {
      // The generated node carries the matched text; skip past it.
      cursor = offset + m.length;
    } else {
      // The generated node precedes the (untouched) matched text.
      cursor = offset;
    }
  }
  if (cursor < value.length) {
    pieces.push({
      type: 'text',
      value: value.slice(cursor),
    });
  }

  leaf.parent.children.splice(leaf.index, 1, ...pieces);
}

// Group a line's matches by the leaf that contains each match's start, then
// rewrite each affected leaf. Returns true if anything was rewritten.
function applyMatches(
  line: Element,
  findMatches: (text: string) => Match[],
  makeNode: (match: Match) => Element,
  replace: boolean,
): boolean {
  const { leaves, text } = collectTextLeaves(line);
  if (!text) return false;

  const matches = dropOverlaps(findMatches(text));
  if (matches.length === 0) return false;

  const by_leaf = new Map<TextLeaf, Match[]>();
  for (const m of matches) {
    const leaf = leaves.find((l) => m.index >= l.start && m.index < l.end);
    if (!leaf) continue;
    // In replace mode the generated node stands in for the matched text, so the
    // whole match must live inside one leaf; a match that spills into the next
    // token (rare for URLs) is skipped rather than duplicated.
    if (replace && m.index + m.length > leaf.end) continue;
    const bucket = by_leaf.get(leaf);
    if (bucket) bucket.push(m);
    else by_leaf.set(leaf, [m]);
  }

  for (const [leaf, leaf_matches] of by_leaf) {
    rewriteLeaf(leaf, leaf_matches, makeNode, replace);
  }
  return by_leaf.size > 0;
}

/* ------------------------------------------------------------------ */
/* Inline color swatches                                              */
/* ------------------------------------------------------------------ */

// The full set of CSS named colors (lower-cased). `transparent`/`currentcolor`
// are intentionally excluded since they have no meaningful swatch.
// const NAMED_COLORS = new Set([
//   'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
//   'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood',
//   'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
//   'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
//   'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
//   'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
//   'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
//   'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
//   'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
//   'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
//   'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
//   'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
//   'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
//   'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
//   'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
//   'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
//   'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
//   'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
//   'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace',
//   'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
//   'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff',
//   'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red',
//   'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
//   'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray',
//   'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle',
//   'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow',
//   'yellowgreen',
// ]);

// Hex (#rgb / #rgba / #rrggbb / #rrggbbaa) and functional color notations.
const HEX_OR_FUNC = new RegExp(
  `${String.raw`#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b`
  }|${
    String.raw`\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)`}`,
  'gi',
);
// const WORD = /\b[a-z]+\b/gi;

function findColors(text: string): Match[] {
  const matches: Match[] = [];

  for (const m of text.matchAll(HEX_OR_FUNC)) {
    matches.push({
      index: m.index,
      length: m[0].length,
      value: m[0],
    });
  }
  // for (const m of text.matchAll(WORD)) {
  //   if (NAMED_COLORS.has(m[0].toLowerCase())) {
  //     matches.push({
  //       index: m.index,
  //       length: m[0].length,
  //       value: m[0],
  //     });
  //   }
  // }

  return matches;
}

function makeSwatch(color: string): Element {
  return {
    children: [{
      children: [],
      properties: {
        className: ['inline-color'],
        style: `background-color:${color}`,
      },
      tagName: 'span',
      type: 'element',
    }],
    properties: { className: ['inline-color-wrapper'] },
    tagName: 'span',
    type: 'element',
  };
}

/**
 * Inserts a color swatch before every CSS color literal. `state.found` is set
 * true when at least one swatch is emitted, so the caller can mirror Prism's
 * `inline_colors_present` flag.
 */
export function createInlineColorTransformer(state: { found: boolean; }): ShikiTransformer {
  return {
    line(line): void {
      // `replace: false` -> swatch sits before the (untouched) color text.
      if (applyMatches(line, findColors, (m) => makeSwatch(m.value), false)) {
        state.found = true;
      }
    },
    name: 'inline-color',
  };
}

/* ------------------------------------------------------------------ */
/* URL autolinking                                                    */
/* ------------------------------------------------------------------ */

// Only http(s) URLs are linkified, which keeps generated `href`s safe (no
// `javascript:` / `data:` schemes can match).
const URL_RE = /\bhttps?:\/\/[^\s"'<>`)\]}]+/gi;
// Trailing punctuation that is more likely sentence/markup syntax than URL.
const TRAILING_PUNCT = /[.,;:!?]+$/;

function findUrls(text: string): Match[] {
  const matches: Match[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const trimmed = m[0].replace(TRAILING_PUNCT, '');
    if (trimmed.length === 0) continue;
    matches.push({
      index: m.index,
      length: trimmed.length,
      value: trimmed,
    });
  }
  return matches;
}

function makeLink(url: string): Element {
  return {
    children: [{
      type: 'text',
      value: url,
    }],
    properties: {
      className: ['url-link'],
      href: url,
      rel: 'noopener noreferrer nofollow',
      target: '_blank',
    },
    tagName: 'a',
    type: 'element',
  };
}

/** Wraps bare http(s) URLs found inside highlighted code in clickable links. */
export function createAutolinkTransformer(): ShikiTransformer {
  return {
    line(line): void {
      // `replace: true` -> the anchor stands in for the matched URL text.
      applyMatches(line, findUrls, (m) => makeLink(m.value), true);
    },
    name: 'autolink',
  };
}
