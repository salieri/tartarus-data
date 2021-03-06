import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';

import { SpiderHandle } from '../../handle';
import { SpiderStore } from '../store';

const wait = promisify(setTimeout);
const writeFilePromised = promisify(fs.writeFile);

export abstract class Storable {
  public readonly priority: number;

  public readonly filename: string;

  protected constructor(filename: string, priority: number) {
    this.filename = filename;
    this.priority = priority;
  }

  public abstract async store(store: SpiderStore, h: SpiderHandle): Promise<void>;


  protected async writeFile(data: any, store: SpiderStore, h: SpiderHandle, encoding?: string): Promise<void> {
    const targetPath = this.getTargetDirectory(store, h);

    shelljs.mkdir('-p', targetPath);

    const finalFn = this.getTargetFilename(store, h);

    await writeFilePromised(finalFn, data, encoding);
  }


  public getTargetDirectory(store: SpiderStore, h: SpiderHandle): string {
    return h.getPath(store.getSubPaths(this.filename, h.getSiteConfig().name));
  }


  public getTargetFilename(store: SpiderStore, h: SpiderHandle): string {
    return path.join(
      this.getTargetDirectory(store, h),
      this.filename,
    );
  }


  public async pause(timeInMillis: number): Promise<void> {
    await wait(timeInMillis);
  }


  public exists(store: SpiderStore, h: SpiderHandle): boolean {
    return fs.existsSync(this.getTargetFilename(store, h));
  }
}

