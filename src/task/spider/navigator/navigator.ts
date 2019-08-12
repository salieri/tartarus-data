import chalk from 'chalk';
import _ from 'lodash';
import { promisify } from 'util';

import { SpiderHandle } from '../handle';
import { LogLevel } from '../../task';

const wait = promisify(setTimeout);

export type SpiderNavigatorUrlCallback = (h: SpiderHandle) => string | null;
export type SpiderNavigatorIsDoneCallback = (h: SpiderHandle) => boolean;

export interface SpiderNavigatorOpts {
  baseTarget: string;
  target: SpiderNavigatorUrlCallback | string;
  isDone?: SpiderNavigatorIsDoneCallback;
}


export interface SpiderNavigatorFetchResponse {
  rawData: string;
  rawResponse: any;
}


export abstract class SpiderNavigator {
  protected opts: SpiderNavigatorOpts;

  public constructor(opts: SpiderNavigatorOpts) {
    this.opts = opts;
  }


  protected abstract fetch(target: string, h: SpiderHandle): Promise<SpiderNavigatorFetchResponse>;


  public getBaseTarget(): string {
    return this.opts.baseTarget;
  }


  protected getNext(previousHandle: SpiderHandle): string | null {
    if (typeof this.opts.target === 'string') {
      return this.opts.target;
    }

    return this.opts.target(previousHandle);
  }


  public isDone(h: SpiderHandle): boolean {
    if (this.opts.isDone) {
      return this.opts.isDone(h);
    }

    const response = h.getResponseData();

    if (!response) {
      return true;
    }

    const data = response.data;

    return ((_.isEmpty(data)) || (!_.isArray(data)) || (data.length < 1));
  }


  public async attemptFetch(previousHandle: SpiderHandle, iteration: number): Promise<SpiderHandle | null> {
    const target = await this.getNext(previousHandle);

    if (!target) {
      return null;
    }

    const spider = previousHandle.getSpider();

    // spider.report(LogLevel.Info, `Fetching ${chalk.bold(target)}`);

    const response = await this.fetch(target, previousHandle);
    const data = await spider.getData().parse(response.rawData);

    return new SpiderHandle(
      spider,
      iteration,
      response,
      data,
    );
  }


  public async pause(lengthInMs: number): Promise<void> {
    await wait(lengthInMs);
  }
}
