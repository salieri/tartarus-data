import { Storable } from './storable';
import { SpiderHandle } from '../../handle';
import { SpiderStore } from '../store';
import { HttpFetch } from '../../http-fetch';


export class StorableFromUrl extends Storable {
  protected url: string;

  public constructor(filename: string, url: string) {
    super(filename, -10);

    this.url = url;
  }


  public async store(store: SpiderStore, h: SpiderHandle): Promise<void> {
    const siteConfig = h.getSiteConfig();
    const fetcher = new HttpFetch(h.getSpider());

    const response = await fetcher.fetch(
      {
        method: 'get',
        url: this.url,
        responseType: 'arraybuffer',

        headers: {
          'User-Agent': siteConfig.request.headers,
        },
      },
      HttpFetch.determineRetryOpts(siteConfig),
    );

    await this.writeFile(response.data, store, h);
  }
}
