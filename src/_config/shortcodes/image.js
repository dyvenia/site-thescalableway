import Image from '@11ty/eleventy-img';
import path from 'node:path';
import htmlmin from 'html-minifier-terser';

/**
 * Converts an attribute map object to a string of HTML attributes.
 * @param {Object} attributeMap - The attribute map object.
 * @returns {string} - The string of HTML attributes.
 */
const stringifyAttributes = attributeMap => {
  return Object.entries(attributeMap)
    .map(([attribute, value]) => {
      if (typeof value === 'undefined') return '';
      return `${attribute}="${value}"`;
    })
    .join(' ');
};

export const imageShortcode = async (
  src,
  alt = '',
  caption = '',
  loading = 'lazy',
  className,
  sizes = '100vw',
  widths = [650, 960, 1200],
  formats = ['webp', 'jpeg']
) => {
  const metadata = await Image(src, {
    widths: [...widths, null],
    formats: [...formats, null],
    urlPath: '/assets/images/',
    outputDir: './_site/assets/images/',
    filenameFormat: (id, src, width, format, options) => {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    }
  });

  const lowsrc = metadata.jpeg[metadata.jpeg.length - 1];

  // Getting the URL to use
  let imgSrc = src;
  if (!imgSrc.startsWith('.')) {
    const inputPath = this.page.inputPath;
    const pathParts = inputPath.split('/');
    pathParts.pop();
    imgSrc = `${pathParts.join('/')}/${src}`;
  }

  const imageSources = Object.values(metadata)
    .map(imageFormat => {
      return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat
        .map(entry => entry.srcset)
        .join(', ')}" sizes="${sizes}">`;
    })
    .join('\n');

  const imgageAttributes = stringifyAttributes({
    src: lowsrc.url,
    width: lowsrc.width,
    height: lowsrc.height,
    alt,
    loading,
    decoding: loading === 'eager' ? 'sync' : 'async'
  });

  const imageElement = caption
    ? `<figure slot="image" class="flow ${className ? `${className}` : ''}">
				<picture>
					${imageSources}
					<img
					${imgageAttributes}>
				</picture>
				<figcaption>${caption}</figcaption>
			</figure>`
    : `<picture slot="image" class="flow ${className ? `${className}` : ''}">
				${imageSources}
				<img
				${imgageAttributes}>
			</picture>`;

  return htmlmin.minify(imageElement, {collapseWhitespace: true});
};
