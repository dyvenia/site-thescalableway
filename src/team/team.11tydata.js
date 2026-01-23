export default {
  layout: 'single_author',
  tags: 'team_members',
  toc: false,
  eleventyComputed: {
    permalink(data) {
      if (data.create_profile === false) {
        return false;
      }
      return `/author/${data.page.fileSlug}/index.html`;
    }
  }
};
