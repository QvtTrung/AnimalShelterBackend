import { createDirectus, rest, authentication } from '@directus/sdk';
import config from './index';

// Initialize Directus Client
if (!config.directus.url) {
  throw new Error('Directus URL is not defined in configuration');
}

const directus = createDirectus(config.directus.url)
  .with(rest())
  .with(authentication('json'));

// Set the token globally if it exists in the configuration
// if (config.directus.token) {
//   directus.setToken(config.directus.token);
// }

  export { directus };

