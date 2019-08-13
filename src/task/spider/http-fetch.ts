import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';
import { promisify } from 'util';
import chalk from 'chalk';

import { LogLevel } from '../task';
import { FinalParameters, SpiderSiteConfig, SpiderTask } from './spider';

const wait = promisify(setTimeout);

// @link https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class RecoverableFetchError extends Error {
  public constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, RecoverableFetchError.prototype);
  }
}


// @https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class SkippableFetchError extends Error {
  public constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, SkippableFetchError.prototype);
  }
}


export interface RetryOpts {
  maxRetries?: number;
  requestTimeout?: number;
  recoverableHttpStatus?: number[];
  skippableHttpStatus?: number[];
  retryDelay?: number;
}

export type RetryOptsFinal = FinalParameters<RetryOpts>;


type OmittedAxiosRequestConfig = Omit<AxiosRequestConfig, 'url'>;

export interface AxiosRequestConfigExtended extends OmittedAxiosRequestConfig {
  url: string | string[];
}


export class HttpFetch {
  protected spider: SpiderTask;

  public static readonly recoverableHttpStatuses = [
    // official
    502, 503, 504,
    // cloudflare
    520, 521, 522, 523, 524,
  ];

  public static readonly skippableHttpStatuses = [
    // official
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
    417, 418, 421, 422, 423, 424, 425, 426, 428, 431, 451,
    // unofficial
    419, 420, 430, 450, 498, 499,
  ];

  public constructor(spider: SpiderTask) {
    this.spider = spider;
  }


  protected isRecoverableError(err: any, retryOpts: RetryOptsFinal): boolean {
    return (
      ((err.request) && (!err.response)) // connection failed
      || (err.message === 'Tartarus Spider: network timeout') // timeout
      || (
        // response failed in a recoverable way
        (err.response)
        && (err.response.status)
        && (retryOpts.recoverableHttpStatus.indexOf(err.response.status) >= 0)
      )
    );
  }


  protected isSkippableError(err: any, retryOpts: RetryOptsFinal): boolean {
    return (
      (err.response)
      && (err.response.status)
      && (retryOpts.skippableHttpStatus.indexOf(err.response.status) >= 0)
    );
  }


  protected async attemptFetch(requestOpts: AxiosRequestConfig, retryOpts: RetryOptsFinal): Promise<AxiosResponse<any>> {
    const abort = axios.CancelToken.source();
    const timeout = retryOpts.requestTimeout;
    let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => abort.cancel('Tartarus Spider: network timeout'), timeout);

    this.spider.report(LogLevel.Debug, `Fetching ${chalk.bold(requestOpts.url || '')}`);

    try {
      const response = await axios.request(
        _.merge(requestOpts, { cancelToken: abort.token, timeout: (timeout + 1000) }),
      );

      clearTimeout(timeoutHandle);

      timeoutHandle = null;

      return response;
    } catch (err) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      if (this.isSkippableError(err, retryOpts)) {
        const newErr = new SkippableFetchError(err.message);

        (newErr as any).originalError = err;

        throw newErr;
      }

      if (this.isRecoverableError(err, retryOpts)) {
        const newErr = new RecoverableFetchError(err.message);

        (newErr as any).originalError = err;

        throw newErr;
      }

      throw err;
    }
  }


  public async fetch(requestOpts: AxiosRequestConfigExtended, retryOpts: RetryOpts): Promise<AxiosResponse<any>> {
    const finalRetryOpts: RetryOptsFinal = _.merge(
      {
        maxRetries: 15,
        requestTimeout: 300000,
        recoverableHttpStatus: HttpFetch.recoverableHttpStatuses,
        skippableHttpStatus: HttpFetch.skippableHttpStatuses,
        retryDelay: 15000,
      },
      retryOpts,
    );

    const urlAlternatives = _.castArray(requestOpts.url);
    const cleanedRequestOpts = _.cloneDeep(requestOpts);

    let urlIndex = 0;

    for (let attempt = 0; (attempt < finalRetryOpts.maxRetries); attempt += 1) {
      try {
        cleanedRequestOpts.url = urlAlternatives[urlIndex];

        // eslint-disable-next-line no-await-in-loop
        return (await this.attemptFetch(cleanedRequestOpts as AxiosRequestConfig, finalRetryOpts));
      } catch (err) {
        this.spider.report(LogLevel.Debug, 'HTTP fetch failed', err.message);

        if (
          (urlAlternatives.length > 1)
          && (urlIndex < urlAlternatives.length - 1)
          && (err instanceof SkippableFetchError)
          && (_.get(err, 'originalError.response.status') === 404)
        ) {
          urlIndex += 1;
        } else {
          if (err instanceof SkippableFetchError) {
            throw err;
          }

          if (!(err instanceof RecoverableFetchError)) {
            throw err;
          }

          if (attempt < finalRetryOpts.maxRetries - 1) {
            this.spider.report(
              LogLevel.Debug,
              `Retrying URL after server responded with error ${_.get(err, 'originalError.response.status')}`,
              err,
            );

            // eslint-disable-next-line no-await-in-loop
            await wait(finalRetryOpts.retryDelay);
          } else {
            const newErr = new Error(
              `Could not successfully retrieve '${requestOpts.url}', even after ${finalRetryOpts.maxRetries} retries`,
            );

            (newErr as any).originalError = err;

            throw newErr;
          }
        }
      }
    }

    // never reached
    throw new Error('Unexpected completion');
  }


  public static determineRetryOpts(siteConfig: SpiderSiteConfig): RetryOpts {
    return {
      maxRetries: siteConfig.behavior.maxRetries,
      requestTimeout: siteConfig.behavior.requestTimeout,
      retryDelay: siteConfig.behavior.retryDelay,
      skippableHttpStatus: siteConfig.behavior.skippableHttpStatus,
      recoverableHttpStatus: siteConfig.behavior.recoverableHttpStatus,
    };
  }
}
