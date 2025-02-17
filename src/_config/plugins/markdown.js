import markdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItPrism from 'markdown-it-prism';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItClass from '@toycode/markdown-it-class';
import markdownItLinkAttributes from 'markdown-it-link-attributes';
import {full as markdownItEmoji} from 'markdown-it-emoji';
import markdownItFootnote from 'markdown-it-footnote';
import markdownitMark from 'markdown-it-mark';
import markdownitAbbr from 'markdown-it-abbr';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';
import {slugifyString} from '../filters/slugify.js';
import {optimize} from 'svgo';
import {readFileSync} from 'node:fs';
import path from 'node:path';

export const markdownLib = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
})
  .disable('code')
  .use(markdownItAttrs)
  .use(markdownItPrism, {
    defaultLanguage: 'plaintext'
  })
  .use(markdownItAnchor, {
    slugify: slugifyString,
    tabIndex: false,
    permalink: markdownItAnchor.permalink.headerLink({
      class: 'heading-anchor'
    })
  })
  .use(markdownItClass, {
    ol: 'list',
    ul: 'list'
  })
  .use(markdownItLinkAttributes, [
    {
      // match external links
      matcher(href) {
        return href.match(/^https?:\/\//);
      },
      attrs: {
        rel: 'noopener'
      }
    }
  ])
  .use(markdownItEmoji)
  .use(markdownItFootnote)
  .use(markdownitMark)
  .use(markdownitAbbr)
  .use(md => {
    md.renderer.rules.image = (tokens, idx) => {
      const token = tokens[idx];
      let src = token.attrGet('src');
      const alt = token.content || '';
      const caption = token.attrGet('title');

      // CMS image paths
      if (src.startsWith('/src/')) {
        src = src.replace(/^\/src\//, '/');
      }

      // SVG separately
      if (path.extname(src).toLowerCase() === '.svg') {
        const svgData = readFileSync(src, 'utf8');
        const {data: optimizedSvg} = optimize(svgData, {
          plugins: [{name: 'removeDimensions', params: {enableViewBox: true}}]
        });

        const svgWithAttrs = alt
          ? optimizedSvg.replace('<svg', `<svg class="svg-image" aria-label="${alt}"`)
          : optimizedSvg.replace('<svg', '<svg class="svg-image" role="presentation" aria-hidden="true"');

        return title
          ? `<figure class="flow">${svgWithAttrs}<figcaption>${title}</figcaption></figure>`
          : svgWithAttrs;
      }

      // Collect attributes
      const attributes = token.attrs || [];
      const hasEleventyWidths = attributes.some(([key]) => key === 'eleventy:widths');
      if (!hasEleventyWidths) {
        attributes.push(['eleventy:widths', '650,960,1200']);
      }

      const attributesString = attributes.map(([key, value]) => `${key}="${value}"`).join(' ');
      const imgTag = `<img src="${src}" alt="${alt}" ${attributesString}>`;
      return caption ? `<figure>${imgTag}<figcaption>${caption}</figcaption></figure>` : imgTag;
    };
  })
  .use(markdownItTocDoneRight, {
    placeholder: `{:toc}`,
    slugify: slugifyString,
    containerId: 'toc',
    itemClass: 'flow',
    listType: 'ol'
  });

const originalRender = markdownLib.render.bind(markdownLib);

markdownLib.render = (content, env = {}) => {
  const shouldAddToc = env.toc !== false;
  const tocBeforeContent = shouldAddToc
    ? `{:toc}\n<span class="visually-hidden" id="toc-skipped"></span>\n${content}`
    : content;

  return originalRender(tocBeforeContent, env);
};
