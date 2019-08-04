import fs from 'fs';

import { SpiderNavigatorFetchResponse } from './navigator';

export class SpiderFileNavigator {
  protected async fetch(target: string): Promise<SpiderNavigatorFetchResponse> {
    const data = fs.readFileSync(target, 'utf8');

    return {
      data,
      raw: null,
    };
  }
}
