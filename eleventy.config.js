/**
 * Most adjustments must be made in `./src/_config/*`
 */

/**
 * Configures Eleventy with various settings, collections, plugins, filters, shortcodes, and more.
 * Hint VS Code for eleventyConfig autocompletion.
 * © Henry Desroches - https://gist.github.com/xdesro/69583b25d281d055cd12b144381123bf
 * @param {import("@11ty/eleventy/src/UserConfig")} eleventyConfig -
 * @returns {Object} -
 */

// register dotenv for process.env.* variables to pickup
import dotenv from 'dotenv';
dotenv.config();

// add yaml fs and path support
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

//  config import
import {getAllPosts, onlyMarkdown, tagList} from './src/_config/collections.js';
import events from './src/_config/events.js';
import filters from './src/_config/filters.js';
import plugins from './src/_config/plugins.js';
import shortcodes from './src/_config/shortcodes.js';

// function to load YAML files
function loadYaml(filePath) {
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
  } catch (e) {
    console.error(`Error loading YAML file: ${filePath}`, e);
    return {};
  }
}

// function to merge YAML files
function mergeYamlConfigs() {
  const templatePath = 'src/config_template.yaml';
  const templateConfig = loadYaml(templatePath);

  const configDirs = ['src/admin_dev', 'src/admin_content'];

  configDirs.forEach((dir) => {
    const configPath = path.join(dir, 'config.yaml');
    const userConfig = loadYaml(configPath);

    // merge: userConfig overrides templateConfig where necessary
    const mergedConfig = { ...templateConfig, ...userConfig };

    // write merged content back to the file
    fs.writeFileSync(configPath, yaml.dump(mergedConfig), 'utf8');
    console.log(`Merged YAML written to: ${configPath}`);
  });
}
export default async function (eleventyConfig) {
  // --------------------- merge YAML before eleventy processes files
  mergeYamlConfigs();

  eleventyConfig.addWatchTarget('./src/assets/**/*.{css,js,svg,png,jpeg}');
  eleventyConfig.addWatchTarget('./src/_includes/**/*.{webc}');

  // --------------------- layout aliases
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.addLayoutAlias('page', 'page.njk');
  eleventyConfig.addLayoutAlias('post', 'post.njk');
  eleventyConfig.addLayoutAlias('tags', 'tags.njk');

  //	---------------------  Collections
  eleventyConfig.addCollection('allPosts', getAllPosts);
  eleventyConfig.addCollection('onlyMarkdown', onlyMarkdown);
  eleventyConfig.addCollection('tagList', tagList);

  // ---------------------  Plugins
  eleventyConfig.addPlugin(plugins.htmlConfig);
  eleventyConfig.addPlugin(plugins.cssConfig);
  eleventyConfig.addPlugin(plugins.jsConfig);
  eleventyConfig.addPlugin(plugins.drafts);

  eleventyConfig.addPlugin(plugins.EleventyRenderPlugin);
  eleventyConfig.addPlugin(plugins.EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(plugins.rss);
  eleventyConfig.addPlugin(plugins.syntaxHighlight);

  eleventyConfig.addPlugin(plugins.webc, {
    components: ['./src/_includes/webc/*.webc'],
    useTransform: true
  });

  // ---------------------  bundle
  eleventyConfig.addBundle('css', {hoist: true});

  // 	--------------------- Library and Data
  eleventyConfig.setLibrary('md', plugins.markdownLib);
  eleventyConfig.addDataExtension('yaml', contents => yaml.load(contents));

  // --------------------- Filters
  eleventyConfig.addFilter('toIsoString', filters.toISOString);
  eleventyConfig.addFilter('formatDate', filters.formatDate);
  eleventyConfig.addFilter('markdownFormat', filters.markdownFormat);
  eleventyConfig.addFilter('splitlines', filters.splitlines);
  eleventyConfig.addFilter('striptags', filters.striptags);
  eleventyConfig.addFilter('shuffle', filters.shuffleArray);
  eleventyConfig.addFilter('alphabetic', filters.sortAlphabetically);
  eleventyConfig.addFilter('slugify', filters.slugifyString);

  // --------------------- Shortcodes
  eleventyConfig.addShortcode('svg', shortcodes.svgShortcode);
  eleventyConfig.addShortcode('image', shortcodes.imageShortcode);
  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  // --------------------- Events ---------------------
  if (process.env.ELEVENTY_RUN_MODE === 'serve') {
    eleventyConfig.on('eleventy.after', events.svgToJpeg);
  }

  // --------------------- Passthrough File Copy

  eleventyConfig.addPassthroughCopy({ 'src/admin_dev': 'admin_dev' }); // don't process the CMS folder
  eleventyConfig.addPassthroughCopy({ 'src/admin_content': 'admin_content' }); // don't process the CMS folder

  // Disable 11ty dev server live reload when using CMS locally
  eleventyConfig.setServerOptions({
    liveReload: false
  });

  // -- same path
  ['src/assets/fonts/', 'src/assets/images/template', 'src/assets/og-images'].forEach(path =>
    eleventyConfig.addPassthroughCopy(path)
  );

  eleventyConfig.addPassthroughCopy({
    // -- to root
    'src/assets/images/favicon/*': '/',

    // -- node_modules
    'node_modules/lite-youtube-embed/src/lite-yt-embed.{css,js}': `assets/components/`
  });

  // --------------------- Build Settings
  eleventyConfig.setDataDeepMerge(true);

  // --------------------- Deployment Settings
  eleventyConfig.setBrowserSyncConfig({
    files: './public/static/**/*.css'
  });

  // --------------------- general config

  // const isProduction = process.env.ELEVENTY_ENV === 'production';
  // pathPrefix: isProduction ? '/11ty-test/' : '/'

  return {
    markdownTemplateEngine: 'njk',

    dir: {
      output: '_site',
      input: 'src',
      includes: '_includes',
      layouts: '_layouts'
    }
  };
}

