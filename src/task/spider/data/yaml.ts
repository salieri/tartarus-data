import yaml, { LoadOptions } from 'js-yaml';

import { SpiderData, SpiderDataOpts } from './data';

export interface YamlSpiderDataOpts extends SpiderDataOpts {
  yamlConfig?: LoadOptions;
}

export class SpiderYamlData extends SpiderData {
  // eslint-disable-next-line no-useless-constructor
  public constructor(opts: YamlSpiderDataOpts) {
    super(opts);
  }

  public parseExec(rawData: string): any {
    const opts = this.opts as YamlSpiderDataOpts;

    return yaml.safeLoad(rawData, opts.yamlConfig);
  }
}
