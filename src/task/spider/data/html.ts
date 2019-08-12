import { ConstructorOptions, JSDOM } from 'jsdom';

import { SpiderData, SpiderDataOpts } from './data';


export interface HtmlSpiderDataOpts extends SpiderDataOpts {
  htmlConfig?: ConstructorOptions;
}


export class SpiderHtmlData extends SpiderData {
  // eslint-disable-next-line no-useless-constructor
  public constructor(opts: HtmlSpiderDataOpts = {}) {
    super(opts);
  }

  public parseExec(rawData: string): any {
    const opts = this.opts as HtmlSpiderDataOpts;

    return new JSDOM(rawData, opts.htmlConfig);
  }
}
