import path from 'path';
import shelljs from 'shelljs';
import fs from 'fs';

import { SpiderStore, SpiderStoreOpts } from './store';
import { SpiderHandle } from '../handle';

export type SimpleStoreFilenameCallback = (h: SpiderHandle) => string | null;

export interface SimpleStoreOpts extends SpiderStoreOpts {
  filename: string | SimpleStoreFilenameCallback;
}


export class SimpleStore extends SpiderStore {
  protected opts: SimpleStoreOpts;

  public constructor(opts: SimpleStoreOpts) {
    super(opts);

    this.opts = opts;
  }

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


  protected getFilename(h: SpiderHandle): string | null {
    if (typeof this.opts.filename === 'string') {
      return this.opts.filename;
    }

    return this.opts.filename(h);
  }
}
