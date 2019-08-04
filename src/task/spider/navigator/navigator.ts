import chalk from 'chalk';

import { SpiderHandle } from '../handle';
import { LogLevel } from '../../task';

export type SpiderNavigatorUrlCallback = (h: SpiderHandle) => string | null;

export interface SpiderNavigatorOpts {
  baseTarget: string;
  target: SpiderNavigatorUrlCallback | string;
}

export class RecoverableSpiderNavigatorFetchError extends Error {}


export interface SpiderNavigatorFetchResponse {
  data: string;
  raw: any;
}


export abstract class SpiderNavigator {
  protected opts: SpiderNavigatorOpts;

  public constructor(opts: SpiderNavigatorOpts) {
    this.opts = opts;
  }


  public getBaseTarget(): string {
    return this.opts.baseTarget;
  }


  protected getNext(previousHandle: SpiderHandle): string | null {
    if (typeof this.opts.target === 'string') {
      return this.opts.target;
    }

    return this.opts.target(previousHandle);
  }


  protected abstract fetch(target: string, h: SpiderHandle): Promise<SpiderNavigatorFetchResponse>;


  public async attemptFetch(previousHandle: SpiderHandle, iteration: number): Promise<SpiderHandle | null> {
    const target = await this.getNext(previousHandle);

    if (!target) {
      return null;
    }

    const spider = previousHandle.getSpider();

    spider.report(LogLevel.Info, `Fetching ${chalk.bold(target)}`);

    const response = await this.fetch(target, previousHandle);

    spider.report(LogLevel.Debug, 'Response ok');

    const data = await spider.getData().parse(response.data);

    return new SpiderHandle(
      spider,
      iteration,
      response,
      data,
    );
  }
}
