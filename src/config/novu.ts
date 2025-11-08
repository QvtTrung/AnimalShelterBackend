import { Novu } from '@novu/api';
import config from './index';

if (!config.novu.apiKey) {
  throw new Error('Novu API key is not defined in configuration');
}


const novu = new Novu({ secretKey: config.novu.apiKey });

export default novu;
