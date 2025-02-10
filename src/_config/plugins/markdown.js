import markdownIt from 'markdown-it';
import markdownItPrism from 'markdown-it-prism';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItClass from '@toycode/markdown-it-class';
import markdownItLinkAttributes from 'markdown-it-link-attributes';
import {full as markdownItEmoji} from 'markdown-it-emoji';
import markdownItEleventyImg from 'markdown-it-eleventy-img';
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
  .use(markdownItEleventyImg, {
    imgOptions: {
      widths: [650, 960, null],
      urlPath: '/assets/images/',
      outputDir: './_site/assets/images/',
      formats: ['webp', 'jpeg']
    },
    globalAttributes: {
      loading: 'lazy',
      decoding: 'async',
      sizes: '100vw'
    },
    // prepend src for markdown images
    resolvePath: (filepath, env) => {
      return path.join('.', filepath);
    },
    renderImage(image, attributes) {
      const [Image, options] = image;
      const [src, attrs] = attributes;

      // check if source is SVG
      if (path.extname(src).toLowerCase() === '.svg') {
        const svgData = readFileSync(src, 'utf8');
        const {data: optimizedSvg} = optimize(svgData, {
          plugins: [
            {
              name: 'removeDimensions',
              params: {
                enableViewBox: true
              }
            }
          ]
        });

        const svgWithAttrs = attrs.alt
          ? optimizedSvg.replace('<svg', `<svg class="svg-image" aria-label="${attrs.alt}"`)
          : optimizedSvg.replace('<svg', '<svg class="svg-image" role="presentation" aria-hidden="true"');

        const svgElement = attrs.title
          ? `<figure class="flow">
                    ${svgWithAttrs}
                    <figcaption>${attrs.title}</figcaption>
                 </figure>`
          : optimizedSvg;
        return svgElement;
      }

      Image(src, options);

      const metadata = Image.statsSync(src, options);
      const imageMarkup = Image.generateHTML(metadata, attrs, {
        whitespaceMode: 'inline'
      });

      const imageElement = attrs.title
        ? `<figure class="flow">
			${imageMarkup}
					<figcaption>${attrs.title}</figcaption>
				</figure>`
        : `${imageMarkup}`;

      return imageElement;
    }
  })
  .use(markdownItFootnote)
  .use(markdownitMark)
  .use(markdownitAbbr)
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
