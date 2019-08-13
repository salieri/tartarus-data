import path from 'path';
import shelljs from 'shelljs';
import fs from 'fs';

import { SpiderStore, SpiderStoreOpts } from './store';
import { SpiderHandle } from '../handle';

export type SimpleStorePostSaveCallback = (filename: string, h: SpiderHandle) => Promise<void> | void;
export type SimpleStoreDataCallback = (h: SpiderHandle) => Promise<string | null> | string | null;
export type SimpleStoreFilenameCallback = (h: SpiderHandle) => string | null;

export interface SimpleStoreOpts extends SpiderStoreOpts {
  filename: string | SimpleStoreFilenameCallback;
  encoding?: string;
  data?: SimpleStoreDataCallback;
  post?: SimpleStorePostSaveCallback;
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
    const data = await this.getStorableData(h);

    if (!data) {
      throw new Error('Missing response data');
    }

    shelljs.mkdir('-p', filePath);

    fs.writeFileSync(finalFn, data, this.opts.encoding || 'utf8');

    if (this.opts.post) {
      await this.opts.post(finalFn, h);
    }

    return true;
  }


  protected async getStorableData(h: SpiderHandle): Promise<string | null> {
    if (this.opts.data) {
      return this.opts.data(h);
    }

    const data = h.getResponseData();

    if (!data) {
      return null;
    }

    return data.raw;
  }


  protected getFilename(h: SpiderHandle): string | null {
    if (typeof this.opts.filename === 'string') {
      return this.opts.filename;
    }

    return this.opts.filename(h);
  }
}
