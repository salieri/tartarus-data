import path from 'path';
import shelljs from 'shelljs';
import fs from 'fs';

import { SpiderStore } from './store';
import { SpiderHandle } from '../handle';


export class SimpleStore extends SpiderStore {
  public async save(h: SpiderHandle): Promise<boolean> {
    const fn = this.getFilename(h);

    if (!fn) {
      return false;
    }

    const baseName = fn.substr(0, fn.length - path.extname(fn).length);
    const filePath = h.getPath(this.getSubPaths(baseName, h.getSiteConfig().name));

    const finalFn = path.join(filePath, fn);
    const data = h.getResponseData();

    if (!data) {
      throw new Error('Missing response data');
    }

    shelljs.mkdir('-p', filePath);

    fs.writeFileSync(finalFn, data.raw, 'utf8');

    return true;
  }
}
