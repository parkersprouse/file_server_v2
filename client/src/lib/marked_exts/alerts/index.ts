import { createSyntaxPattern, resolveVariants, ucfirst } from './utils.ts';

import type { Alert, AlertVariantItem, Options } from './types.ts';
import type { MarkedExtension, Tokens } from 'marked';

export type { Alert, AlertVariantItem, Options };

/**
 * A [marked](https://marked.js.org/) extension to support [GFM alerts](https://github.com/orgs/community/discussions/16925).
 */
export default function markedAlert(options: Options = {}): MarkedExtension {
  const { className = 'markdown-alert', variants = [] } = options;
  const resolved_variants = resolveVariants(variants);

  return {
    extensions: [
      {
        level: 'block',
        name: 'alert',
        renderer({ meta, tokens = [] }): string {
          let tmpl = `<div class="${meta.className} ${meta.className}-${meta.variant}">\n`;
          tmpl += `<p class="${meta.titleClassName}">`;
          tmpl += meta.icon;
          tmpl += meta.title;
          tmpl += '</p>\n';
          tmpl += this.parser.parse(tokens);
          tmpl += '</div>\n';

          return tmpl;
        },
      },
    ],
    walkTokens(token): void | Promise<void> {
      if (token.type !== 'blockquote') return;

      const matched_variant = resolved_variants.find(({ type }) =>
        new RegExp(createSyntaxPattern(type)).test(token.text));

      if (matched_variant) {
        const {
          type: variant_type,
          icon,
          title = ucfirst(variant_type),
          titleClassName = `${className}-title`,
        } = matched_variant;
        const type_regexp = new RegExp(createSyntaxPattern(variant_type));

        Object.assign(token, {
          meta: {
            className,
            icon,
            title,
            titleClassName,
            variant: variant_type,
          },
          type: 'alert',
        });

        const first_line = token.tokens?.[0] as Tokens.Paragraph;
        const first_line_text = (first_line.raw || '').replace(type_regexp, '').trim();

        if (first_line_text) {
          const pattern_token = first_line.tokens[0] as Tokens.Text;

          Object.assign(pattern_token, {
            raw: pattern_token.raw.replace(type_regexp, ''),
            text: pattern_token.text.replace(type_regexp, ''),
          });

          if (first_line.tokens[1]?.type === 'br') {
            first_line.tokens.splice(1, 1);
          }
        } else {
          token.tokens?.shift();
        }
      }
    },
  };
}
