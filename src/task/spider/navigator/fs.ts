import fs from 'fs';

import { SpiderNavigator, SpiderNavigatorFetchResponse } from './navigator';

export class SpiderFileNavigator extends SpiderNavigator {
  protected async fetch(target: string): Promise<SpiderNavigatorFetchResponse> {
    const data = fs.readFileSync(target, 'utf8');

    return {
      data,
      raw: null,
    };
  }
}
