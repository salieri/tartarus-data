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
    const siteConfig = previousHandle.getSiteConfig();

    if (!target) {
      return null;
    }

    const spider = previousHandle.getSpider();

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < siteConfig.behavior.maxRetries; i += 1) {
      const response = await this.fetch(target, previousHandle); // this throws SkippableError, so don't catch it here

      try {
        const data = await spider.getData().parse(response.rawData);

        return new SpiderHandle(
          spider,
          iteration,
          response,
          data,
        );
      } catch (err) {
        previousHandle.getSpider().report(
          LogLevel.Error,
          `Data parsing failed while trying to fetch ${target}`,
          err.message,
        );

        previousHandle.getSpider().report(
          LogLevel.Debug,
          'Data parsing failure RAW DATA ===>',
          response.rawData,
          '<=== RAW DATA',
          'RAW RESPONSE ===>',
          response.rawResponse,
          '<=== RAW RESPONSE',
        );

        if (i >= siteConfig.behavior.maxRetries - 1) {
          throw err;
        } else {
          await this.pause(siteConfig.behavior.retryDelay);
        }
      }
    }

    // never reached
    return null;
  }


  public async pause(lengthInMs: number): Promise<void> {
    await wait(lengthInMs);
  }
}
