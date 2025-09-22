import {slugifyString} from './filters/slugify.js';

/** All blog posts as a collection. */
export const getAllPosts = collection => {
  return collection.getFilteredByGlob('./src/posts/**/*.md').reverse();
};

/** All case-studies as a collection. */
export const getAllCaseStudies = collection => {
  return collection.getFilteredByGlob('./src/case_studies/**/*.md').reverse();
};

/** All tags from all posts as a collection - excluding custom collections */
export const tagList = collection => {
  const tagsSet = new Set();
  collection.getAll().forEach(item => {
    if (!item.data.tags) return;
    item.data.tags
      .filter(tag => !['posts', 'case-studies', 'all', 'pages', 'team_members'].includes(tag))
      .forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
};

/** Pages for sitemap: markdown/njk pages plus synthesized tag listing URLs */
export const sitemapPages = collection => {
  const pages = collection
    .getFilteredByGlob('./src/**/*.{md,njk}')
    .filter(page => page.data?.excludeFromSitemap !== true);

  const tagsSet = new Set();
  collection.getAll().forEach(item => {
    if (!item.data?.tags) return;
    item.data.tags
      .filter(tag => !['posts', 'case-studies', 'all', 'pages', 'team_members'].includes(tag))
      .forEach(tag => tagsSet.add(tag));
  });

  const tagItems = Array.from(tagsSet).map(tag => ({
    url: `/tags/${slugifyString(tag)}/`,
    date: new Date(),
    data: {changeFreq: 'monthly'}
  }));

  return [...pages, ...tagItems];
};
