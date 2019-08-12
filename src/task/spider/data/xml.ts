import converter, { Options } from 'xml-js';

import { SpiderData, SpiderDataOpts } from './data';

export interface XmlSpiderDataOpts extends SpiderDataOpts {
  xmlConfig?: Options.XML2JS;
}

export class SpiderXmlData extends SpiderData {
  // eslint-disable-next-line no-useless-constructor
  public constructor(opts: XmlSpiderDataOpts = {}) {
    super(opts);
  }

  public parseExec(rawData: string): any {
    const opts = this.opts as XmlSpiderDataOpts;

    return converter.xml2js(rawData, opts.xmlConfig);
  }
}
