# The Scalable Way

The website of thescalable way dyvenia division.

### Blog Contribution Guidelines

Blog articles are markdown files inside the `src/posts` folder. The top of the markdown has a YAML section to define article metadata such as title, description and publish date.

**Code Blocks** are possible with the typical "```" opening and closing. Documentation on syntax highlighting and code blocks is [here](https://www.11ty.dev/docs/plugins/syntaxhighlight/).

**images** should be stored in `src/images`.


### Editor Workflow

* Use `/admin` to do all changes of content to the `dev` branch using the Sveltia UI
* After changes are done to `dev`, notify the site admins that changes should be pushed to production site
* The admins will make a PR in Github from `dev` to `main` and changes will automatically be deployed to the production site within 2-3 mins (Netlify is doing the deployment)

### Adding new Pages / Templates

* Create a github issue with `webdeveloper` tag, web developer will do this

### Running the Site Locally

This site is using a static page generator called `eleventy`, you can read its documentation [here](https://www.11ty.dev/).

If you have `npm` installed, you should be able to run a local version running the commands below. Typically the local site will run on `http://127.0.0.1:8080/`.

```bash
cd site-thescalableway

npm run start
```

### Deployed Sites

- Production is deployed from `main` branch and is available here https://thescalableway.com/
- Dev is deployed from `dev` branch and is available here https://dev--thescalableway.netlify.app/


### Admin Panel

Admin panel is deployed using Sveltia CMS. All admin configurations are in `src/admin/config.yml`.

### Theme Support

For support see: [eleventy-excellent](https://github.com/madrilene/eleventy-excellent).
