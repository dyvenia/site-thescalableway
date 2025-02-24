import Image from '@11ty/eleventy-img';
import path from 'node:path';
import htmlmin from 'html-minifier-terser';

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
  containerClass,
  imageClass,
  widths = [650, 960, 1200],
  sizes = 'auto',
  formats = ['webp', 'jpeg']
) => {
  // Prepend "./src" if not present
  if (!src.startsWith('./src')) {
    src = `./src${src}`;
  }
  // check if source is SVG
  if (path.extname(src).toLowerCase() === '.svg') {
    const svgData = readFileSync(src, 'utf8');
    const {data: optimizedSvg} = await optimize(svgData, {
      plugins: [
        {
          name: 'removeDimensions',
          params: {
            enableViewBox: true
          }
        }
      ]
    });

    const svgAttributes = stringifyAttributes({
      'class': `svg-image ${className || ''}`.trim(),
      'role': alt ? 'img' : 'presentation',
      'aria-label': alt || undefined,
      'aria-hidden': alt ? 'false' : 'true'
    });

    const svgElement = caption
      ? `<figure class="flow ${className || ''}">
            ${optimizedSvg.replace('<svg', `<svg ${svgAttributes}`)}
            <figcaption>${caption}</figcaption>
          </figure>`
      : optimizedSvg.replace('<svg', `<svg ${svgAttributes}`);

    return htmlmin.minify(svgElement, {collapseWhitespace: true});
  }

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

  const lowsrc = metadata.jpeg?.slice(-1)[0] ||
    metadata.webp?.slice(-1)[0] ||
    metadata.png?.slice(-1)[0] || {url: src, width: null, height: null};

  const imageSources = Object.values(metadata)
    .map(imageFormat => {
      return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat
        .map(entry => entry.srcset)
        .join(', ')}" sizes="${sizes}">`;
    })
    .join('\n');

  const imageAttributes = stringifyAttributes({
    'src': lowsrc.url,
    'width': lowsrc.width,
    'height': lowsrc.height,
    alt,
    loading,
    'decoding': loading === 'eager' ? 'sync' : 'async',
    ...(imageClass && {class: imageClass}),
    'eleventy:ignore': ''
  });

  const pictureElement = `<picture> ${imageSources}<img ${imageAttributes}></picture>`;

  return caption
    ? `<figure slot="image"${containerClass ? ` class="${containerClass}"` : ''}>${pictureElement}<figcaption>${caption}</figcaption></figure>`
    : `<picture slot="image"${containerClass ? ` class="${containerClass}"` : ''}>${imageSources}<img ${imageAttributes}></picture>`;
};
