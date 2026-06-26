// by Chris Burnell: https://chrisburnell.com/article/some-eleventy-filters/#markdown-format

import markdownParser from 'markdown-it';

const markdown = markdownParser({
  html: true,
  linkify: true
});

/** Preserve paragraph breaks; turn single newlines into <br> */
const withBreaks = string => {
  return String(string)
    .trim()
    .split(/\r?\n{2,}/)
    .map(paragraph => paragraph.replace(/\r?\n/g, '<br>'))
    .join('\n\n');
};

export const markdownFormat = string => {
  return markdown.render(withBreaks(string));
};

export const markdownInline = string => {
  return markdown.renderInline(withBreaks(string));
};
