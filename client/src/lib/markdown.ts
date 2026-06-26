/**
 * Lazy-loaded Markdown renderer.
 *
 * `marked` (parser) and `dompurify` (sanitizer) are only pulled in the first
 * time a Markdown file is rendered, mirroring the lazy Prism loader so the
 * initial bundle stays lean. The rendered HTML is ALWAYS sanitized before it
 * reaches `v-html`, since Markdown can embed arbitrary raw HTML.
 */

interface MarkdownRenderer {
  parse: (raw: string) => string | Promise<string>;
  sanitize: (html: string) => string;
}

// Common Markdown file extensions (compared lower-cased, without the dot).
const MARKDOWN_EXTENSIONS = new Set([
  'markdown',
  'md',
  'mdown',
  'mdtext',
  'mdtxt',
  'mdwn',
  'mdx',
  'mkd',
  'mkdn',
]);

let renderer: MarkdownRenderer | null = null;
let renderer_load_promise: Promise<MarkdownRenderer> | null = null;

export function isMarkdownFile(name: string): boolean {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return MARKDOWN_EXTENSIONS.has(ext);
}

async function ensureRendererLoaded(): Promise<MarkdownRenderer> {
  if (renderer) {
    return renderer;
  }

  if (renderer_load_promise !== null) {
    return renderer_load_promise;
  }

  renderer_load_promise = (async (): Promise<MarkdownRenderer> => {
    const [{ marked }, dompurify] = await Promise.all([
      import('marked'),
      import('dompurify'),
    ]);

    const purify = dompurify.default;
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    renderer = {
      parse: (raw: string): string | Promise<string> => marked.parse(raw),
      sanitize: (html: string): string => purify.sanitize(html),
    };
    return renderer;
  })();

  return renderer_load_promise;
}

/**
 * Parse raw Markdown into a sanitized HTML string safe to inject via `v-html`.
 */
export async function renderMarkdown(raw: string): Promise<string> {
  const { parse, sanitize } = await ensureRendererLoaded();
  return sanitize(await parse(raw));
}
