import chalk from 'chalk';
import path from 'path';
import Joi from '@hapi/joi';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';

import {
  Task,
  TaskOptionsInput,
  LogLevel,
} from '../task';

import { SpiderHandle } from './handle';
import { SpiderStore } from './store';
import { SpiderNavigator } from './navigator';
import { SpiderData } from './data';


const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8')).version as string;
const wait = promisify(setTimeout);

const defaultHeaders = { 'User-Agent': `Tartarus-Data-Spider/${version}` };


/* eslint-disable newline-per-chained-call */
const spiderSiteConfigSchema = Joi.object().keys(
  {
    name: Joi.string().required(),
    data: Joi.any().required().raw(),
    navigator: Joi.any().required().raw(),
    store: Joi.any().required().raw(),

    request: Joi.object().optional().default({ headers: defaultHeaders, method: 'get', responseEncoding: 'utf8' }).keys(
      {
        headers: Joi.object().optional().default(defaultHeaders),
        method: Joi.string().optional().default('get').valid('get', 'head', 'post', 'put', 'delete', 'patch'),
        responseEncoding: Joi.string().optional().default('utf8'),
      },
    ),

    behavior: Joi.object().optional().default({ delay: 1000, retryDelay: 10000, maxRetries: 10 }).keys(
      {
        delay: Joi.number().integer().optional().default(1000),
        retryDelay: Joi.number().integer().optional().default(10000),
        maxRetries: Joi.number().integer().optional().default(10),
      },
    ),
  },
);


export type FinalParameters<T> = {
  readonly [P in keyof T]-?: T[P];
};

export interface SpiderRequestHeaders {
  [key: string]: string;
}

export interface SpiderRequestConfigInput {
  headers?: SpiderRequestHeaders;
  method?: string;
  responseEncoding?: string;
}

export type SpiderRequestConfig = FinalParameters<SpiderRequestConfigInput>;

export interface SpiderBehaviorConfigInput {
  delay?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export type SpiderBehaviorConfig = FinalParameters<SpiderBehaviorConfigInput>;


export interface SpiderSiteConfigInput {
  name: string;
  data: SpiderData;
  navigator: SpiderNavigator;
  store: SpiderStore;

  request?: SpiderRequestConfigInput;
  behavior?: SpiderBehaviorConfigInput;
}


export interface SpiderSiteConfig extends SpiderSiteConfigInput {
  request: SpiderRequestConfig;
  behavior: SpiderBehaviorConfig;
}


export class SpiderTask extends Task {
  protected siteConfig: SpiderSiteConfig;

  protected navigator: SpiderNavigator;

  protected store: SpiderStore;

  protected data: SpiderData;

  protected static readonly recoverableHttpStatuses = [502, 503, 504];


  public constructor(opts: TaskOptionsInput, siteConfig: SpiderSiteConfigInput) {
    super(`Spider (${siteConfig.name})`, opts);

    this.siteConfig = this.validateSiteConfig(siteConfig);

    this.navigator = this.siteConfig.navigator;
    this.store = this.siteConfig.store;
    this.data = this.siteConfig.data;
  }


  protected validateSiteConfig(siteConfig: SpiderSiteConfigInput): SpiderSiteConfig {
    const result = Joi.validate(siteConfig, spiderSiteConfigSchema);

    if (result.error) {
      throw result.error;
    }

    return result.value as SpiderSiteConfig;
  }


  protected async attemptQuery(previousHandle: SpiderHandle, iteration: number): Promise<SpiderHandle | null> {
    const finalUrl = this.navigator.getNextUrl(previousHandle);

    if (!finalUrl) {
      return null;
    }

    this.report(LogLevel.Info, `Fetching ${chalk.bold(finalUrl)}`);

    const response = await axios.request(
      {
        url: finalUrl,
        method: this.siteConfig.request.method,
        headers: this.siteConfig.request.headers,
        responseType: 'arraybuffer',
        responseEncoding: this.siteConfig.request.responseEncoding,
      } as any,
    );

    this.report(LogLevel.Debug, `Response ${response.status}`);

    const data = await this.data.parse(response.data.toString());

    const newHandle = new SpiderHandle(
      this,
      iteration,
      response,
      data,
    );

    return await this.store.save(newHandle) ? newHandle : null;
  }


  protected isRecoverableError(err: any): boolean {
    return (
      ((err.request) && (!err.response)) // connection failed
      || (
        // response failed in a recoverable way
        (err.response)
        && (err.response.status)
        && (SpiderTask.recoverableHttpStatuses.indexOf(err.response.status) >= 0)
      )
    );
  }


  /* eslint-disable no-await-in-loop */
  public async run(): Promise<void> {
    let iteration = 0;
    let lastHandle = new SpiderHandle(this, 0, null, null);

    const maxRetries = this.siteConfig.behavior.maxRetries;
    const delay = this.siteConfig.behavior.delay;
    const retryDelay = this.siteConfig.behavior.retryDelay;

    do {
      let success = false;

      for (let attempt = 0; (attempt < maxRetries) && (!success); attempt += 1) {
        try {
          const handle = await this.attemptQuery(lastHandle, iteration);

          if (!handle) {
            // download complete
            return;
          }

          lastHandle = handle;
          success = true;

          await wait(delay);
        } catch (err) {
          this.report(LogLevel.Info, 'Fetch failed', err);

          if (!this.isRecoverableError(err)) {
            throw err;
          }

          if (attempt < maxRetries - 1) {
            this.report(LogLevel.Info, `Retrying URL after server responded with error ${err.response.status}`, err);

            await wait(retryDelay);
          }
        }
      }

      if (!success) {
        throw new Error(`Could not successfully retrieve URL, even after ${maxRetries} retries`);
      }

      iteration += 1;
    } while (true);
  }


  public toPath(filename: string): string {
    return this.getPath(filename);
  }


  public getSiteConfig(): SpiderSiteConfig {
    return this.siteConfig;
  }
}

