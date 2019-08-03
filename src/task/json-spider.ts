import path from 'path';
import shelljs from 'shelljs';
import _ from 'lodash';
import Joi from '@hapi/joi';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';

import { Task, TaskOptionsInput } from './task';

const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).version as string;
const wait = promisify(setTimeout);


/* eslint-disable newline-per-chained-call */
const jsonSpiderSiteConfigSchema = Joi.object().keys(
  {
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    agent: Joi.string().optional().default(`Tartarus-Data-Json-Spider/${version}`),
    delay: Joi.number().integer().optional().min(0).default(1500),

    navigation: Joi.alternatives(
      [
        Joi.object().required().keys(
          {
            type: Joi.string().required().valid('page'),
            initialValue: Joi.number().integer().optional().default(0).allow(null),
            increment: Joi.number().integer().optional().default(1),
          },
        ),

        Joi.object().required().keys(
          {
            type: Joi.string().required().valid('extract-from-result'),
            initialValue: Joi.any().allow(null).optional().default(null),
            valuePath: Joi.string().required(),
          },
        ),
      ],
    ).required(),

    store: Joi.alternatives(
      [
        Joi.object().required().keys(
          {
            type: Joi.string().required().valid('page'),
            subDirectoryDepth: Joi.number().integer().optional().default(2),
            filename: Joi.string().optional().default('__PAGE__.json'),
          },
        ),

        Joi.object().required().keys(
          {
            type: Joi.string().required().valid('extract-from-result'),
            subDirectoryDepth: Joi.number().integer().optional().default(2),
            filename: Joi.string().optional().default('__VALUE__.json'),
            valuePath: Joi.string().required(),
          },
        ),
      ],
    ).required(),
  },
);


export type FinalParameters<T> = {
  readonly [P in keyof T]-?: T[P];
};


export interface JsonSpiderSiteConfigNavPageInput {
  type: 'page';
  initialValue?: number;
  increment?: number;
}

export interface JsonSpiderSiteConfigNavExtractInput {
  type: 'extract-from-result';
  valuePath: string;
  initialValue?: any;
}

export interface JsonSpiderSiteConfigStoreBaseInput {
  type: string;
  subDirectoryDepth?: number;
  filename?: string;
}

export interface JsonSpiderSiteConfigStorePageInput extends JsonSpiderSiteConfigStoreBaseInput {
  type: 'page';
}

export interface JsonSpiderSiteConfigStoreExtractInput extends JsonSpiderSiteConfigStoreBaseInput {
  type: 'extract-from-result';
  valuePath: string;
}


export type JsonSpiderSiteConfigNavPage = FinalParameters<JsonSpiderSiteConfigNavPageInput>;
export type JsonSpiderSiteConfigNavExtract = FinalParameters<JsonSpiderSiteConfigNavExtractInput>;
export type JsonSpiderSiteConfigStorePage = FinalParameters<JsonSpiderSiteConfigStorePageInput>;
export type JsonSpiderSiteConfigStoreExtract = FinalParameters<JsonSpiderSiteConfigStoreExtractInput>;


export interface JsonSpiderSiteConfigInput {
  name: string;
  url: string;
  agent?: string;
  delay?: number;

  navigation: JsonSpiderSiteConfigNavPageInput|JsonSpiderSiteConfigNavExtractInput;
  store: JsonSpiderSiteConfigStorePageInput|JsonSpiderSiteConfigStoreExtractInput;
}


export interface JsonSpiderSiteConfig extends JsonSpiderSiteConfigInput {
  agent: string;
  delay: number;

  navigation: JsonSpiderSiteConfigNavPage|JsonSpiderSiteConfigNavExtract;
  store: JsonSpiderSiteConfigStorePage|JsonSpiderSiteConfigStoreExtract;
}


export class JsonSpiderTask extends Task {
  protected siteConfig: JsonSpiderSiteConfig;


  public constructor(opts: TaskOptionsInput, siteConfig: JsonSpiderSiteConfigInput) {
    super(`Json Spider (${siteConfig.url})`, opts);

    this.siteConfig = this.validateSiteConfig(siteConfig);
  }


  protected validateSiteConfig(siteConfig: JsonSpiderSiteConfigInput): JsonSpiderSiteConfig {
    const result = Joi.validate(siteConfig, jsonSpiderSiteConfigSchema);

    if (result.error) {
      throw result.error;
    }

    return result.value as JsonSpiderSiteConfig;
  }


  protected extractValue(valuePath: string, result: any): any {
    const finalPath = valuePath.replace('__LAST__', `${result.length - 1}`);

    return _.get(result, finalPath);
  }


  protected determineNextQueryUrl(iteration: number, lastResult: any): string {
    const kw: any = {};
    const genericNav = this.siteConfig.navigation;

    if (genericNav.type === 'page') {
      const nav = genericNav as JsonSpiderSiteConfigNavPage;

      // eslint-disable-next-line dot-notation
      kw['__PAGE__'] = nav.initialValue + (iteration * nav.increment);
    }

    if (genericNav.type === 'extract-from-result') {
      const nav = genericNav as JsonSpiderSiteConfigNavExtract;

      // eslint-disable-next-line dot-notation
      kw['__VALUE__'] = lastResult ? this.extractValue(nav.valuePath, lastResult) : nav.initialValue;
    }

    const url = _.reduce(
      kw,
      (result: string, value: string, key: string): string => result.replace(new RegExp(key, 'g'), value),
      this.siteConfig.url,
    );

    const u = new URL(url);

    u.searchParams.forEach(
      (val: string, key: string, parent: URLSearchParams) => {
        if (val === 'null') {
          parent.delete(key);
        }
      },
    );

    u.search = u.searchParams.toString();

    return u.toString();
  }


  protected getSubPaths(fn: string, depth: number, name: string): string {
    return _.reduce(
      _.times(depth),
      (result, value) => `${result}${fn.substr(value, 1) || '_'}/`,
      `${name.toLowerCase().replace(/[^a-z0-9_.-]/g, '_')}/`,
    );
  }


  protected async storeResult(iteration: number, lastResult: any): Promise<void> {
    const kw: any = {};
    const genericStore = this.siteConfig.store;

    if (genericStore.type === 'page') {
      // eslint-disable-next-line dot-notation
      kw['__PAGE__'] = iteration;
    }

    if (genericStore.type === 'extract-from-result') {
      const store = genericStore as JsonSpiderSiteConfigStoreExtract;

      // eslint-disable-next-line dot-notation
      kw['__VALUE__'] = this.extractValue(store.valuePath, lastResult);
    }

    const fn = _.reduce(
      kw,
      (result: string, value: string, key: string): string => result.replace(new RegExp(key, 'g'), value),
      genericStore.filename,
    );

    const filePath = this.getPath(this.getSubPaths(path.basename(fn, '.json'), genericStore.subDirectoryDepth, this.siteConfig.name));

    shelljs.mkdir('-p', filePath);

    const finalFn = path.join(filePath, fn);

    fs.writeFileSync(finalFn, JSON.stringify(lastResult), 'utf8');
  }


  public async run(): Promise<void> {
    let iteration = 0;
    let lastResult: any = null;

    do {
      const finalUrl = this.determineNextQueryUrl(iteration, lastResult);

      // eslint-disable-next-line no-await-in-loop
      const lastResultResponse = await axios.get(
        finalUrl,
        {
          headers: { 'User-Agent': this.siteConfig.agent },
          responseType: 'json',
        },
      );

      lastResult = lastResultResponse.data;

      // eslint-disable-next-line no-await-in-loop
      await this.storeResult(iteration, lastResult);

      // eslint-disable-next-line no-await-in-loop
      await wait(this.siteConfig.delay);

      iteration += 1;
    } while (lastResult);
  }
}
