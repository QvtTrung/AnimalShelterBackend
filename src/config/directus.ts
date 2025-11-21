import { createDirectus, rest, authentication } from '@directus/sdk';
import config from './index';

// Initialize Directus Client
if (!config.directus.url) {
  throw new Error('Directus URL is not defined in configuration');
}

// Main authenticated client for login/register/authenticated operations
// This client manages authentication state
const directus = createDirectus(config.directus.url)
  .with(rest())
  .with(authentication('json'));

// Public client for unauthenticated reads (pets, reports, etc.)
// This client never has authentication and works with public permissions
// NOTE: If you get permission errors for reports_images, check Directus:
// Settings > Roles & Permissions > Public > reports_images > Read (enable)
const publicDirectus = createDirectus(config.directus.url).with(rest());

export { directus, publicDirectus };

