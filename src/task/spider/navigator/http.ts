import {
  SpiderNavigator,
  SpiderNavigatorFetchResponse,
} from './navigator';

import { SpiderHandle } from '../handle';
import { HttpFetch } from '../http-fetch';


export class SpiderHttpNavigator extends SpiderNavigator {
  protected async fetch(target: string, h: SpiderHandle): Promise<SpiderNavigatorFetchResponse> {
    const siteConfig = h.getSiteConfig();

    const fetcher = new HttpFetch(h.getSpider());

    const rawResponse = await fetcher.fetch(
      {
        url: target,
        method: siteConfig.request.method,
        headers: siteConfig.request.headers,
        responseType: 'arraybuffer',
        responseEncoding: siteConfig.request.responseEncoding,
      } as any,
      HttpFetch.determineRetryOpts(siteConfig),
    );

    return {
      rawResponse,
      rawData: rawResponse.data.toString(),
    };
  }
}
