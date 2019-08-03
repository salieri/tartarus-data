import _ from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import fs from 'fs';

import { SpiderHandle } from './handle';


export type SpiderStoreFilenameCallback = (h: SpiderHandle) => string | null;

export interface SpiderStoreOpts {
  subDirectoryDepth: number;
  filename: string | SpiderStoreFilenameCallback;
}


export class SpiderStore {
  protected opts: SpiderStoreOpts;

  public constructor(opts: SpiderStoreOpts) {
    this.opts = opts;
  }

  public async save(h: SpiderHandle): Promise<boolean> {
    const fn = this.getFilename(h);

    if (!fn) {
      return false;
    }

    const baseName = fn.substr(0, fn.length - path.extname(fn).length);
    const filePath = h.getPath(this.getSubPaths(baseName, this.opts.subDirectoryDepth, h.getSiteConfig().name));

    const finalFn = path.join(filePath, fn);
    const data = h.getResponseData();

    if (!data) {
      throw new Error('Missing response data');
    }

    shelljs.mkdir('-p', filePath);

    fs.writeFileSync(finalFn, data.raw, 'utf8');

    return true;
  }


  protected getSubPaths(fn: string, depth: number, name: string): string {
    const subPaths = _.reduce(
      _.times(depth),
      (result: string, value: number): string => {
        const c = fn.substr(value, 1);

        return c ? path.join(result, c) : path.join('0', result);
      },
      '',
    );

    return path.join(name.toLowerCase().replace(/[^a-z0-9_.-]/g, '_'), subPaths);
  }


  protected getFilename(h: SpiderHandle): string | null {
    if (typeof this.opts.filename === 'string') {
      return this.opts.filename;
    }

    return this.opts.filename(h);
  }
}
