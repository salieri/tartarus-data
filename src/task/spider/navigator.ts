import { SpiderHandle } from './handle';

export type SpiderNavigatorUrlCallback = (h: SpiderHandle) => string | null;

export interface SpiderNavigatorOpts {
  baseUrl: string;
  url: SpiderNavigatorUrlCallback | string;
}

export class SpiderNavigator {
  protected opts: SpiderNavigatorOpts;

  public constructor(opts: SpiderNavigatorOpts) {
    this.opts = opts;
  }


  public getNextUrl(h: SpiderHandle): string | null {
    if (typeof this.opts.url === 'string') {
      return this.opts.url;
    }

    return this.opts.url(h);
  }


  public getBaseUrl(): string {
    return this.opts.baseUrl;
  }
}

