import _ from 'lodash';
import path from 'path';

import { SpiderHandle } from '../handle';


export type SpiderStoreFilenameCallback = (h: SpiderHandle) => string | null;

export interface SpiderStoreOpts {
  subDirectoryDepth: number;
  filename: string | SpiderStoreFilenameCallback;
}


export abstract class SpiderStore {
  protected opts: SpiderStoreOpts;

  public constructor(opts: SpiderStoreOpts) {
    this.opts = opts;
  }


  public abstract async save(h: SpiderHandle): Promise<boolean>;


  public getSubPaths(fn: string, categoryName: string, depth: number = this.opts.subDirectoryDepth): string {
    const subPaths = _.reduce(
      _.times(depth),
      (result: string, value: number): string => {
        const c = fn.substr(value, 1);

        return c ? path.join(result, c) : path.join('0', result);
      },
      '',
    );

    return path.join(categoryName.toLowerCase().replace(/[^a-z0-9_.-]/g, '_'), subPaths);
  }


  protected getFilename(h: SpiderHandle): string | null {
    if (typeof this.opts.filename === 'string') {
      return this.opts.filename;
    }

    return this.opts.filename(h);
  }
}
