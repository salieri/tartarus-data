import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import _ from 'lodash';
import { promisify } from 'util';

import { LogLevel } from '../task';
import { FinalParameters, SpiderSiteConfig, SpiderTask } from './spider';

const wait = promisify(setTimeout);


export class RecoverableFetchError extends Error {}
export class SkippableFetchError extends Error {}


export interface RetryOpts {
  maxRetries?: number;
  requestTimeout?: number;
  recoverableHttpStatus?: number[];
  skippableHttpStatus?: number[];
  retryDelay?: number;
}

export type RetryOptsFinal = FinalParameters<RetryOpts>;


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
    try {
      const abort = axios.CancelToken.source();
      const timeout = retryOpts.requestTimeout;
      const timeoutHandle = setTimeout(() => abort.cancel('Tartarus Spider: network timeout'), timeout);

      const response = await axios.request(
        _.merge(requestOpts, { cancelToken: abort, timeout: (timeout + 1000) }),
      );

      clearTimeout(timeoutHandle);

      return response;
    } catch (err) {
      if (this.isSkippableError(err, retryOpts)) {
        const newErr = new SkippableFetchError(err.message);

        (newErr as any).originalError = err;

        throw newErr;
      }

      if (!this.isRecoverableError(err, retryOpts)) {
        throw err;
      }

      const newErr = new RecoverableFetchError(err.message);

      (newErr as any).originalError = err;

      throw newErr;
    }
  }


  public async fetch(requestOpts: AxiosRequestConfig, retryOpts: RetryOpts): Promise<AxiosResponse<any>> {
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


    for (let attempt = 0; (attempt < finalRetryOpts.maxRetries); attempt += 1) {
      try {
        return this.attemptFetch(requestOpts, finalRetryOpts);
      } catch (err) {
        this.spider.report(LogLevel.Debug, 'HTTP fetch failed', err.originalError || err);

        if (this.isSkippableError(err, finalRetryOpts)) {
          throw err;
        }

        if (!this.isRecoverableError(err, finalRetryOpts)) {
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
          const newErr = new Error(`Could not successfully retrieve '${requestOpts.url}', even after ${finalRetryOpts.maxRetries} retries`);

          (newErr as any).originalError = err;

          throw newErr;
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