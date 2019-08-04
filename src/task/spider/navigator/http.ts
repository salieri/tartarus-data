import axios from 'axios';

import { RecoverableSpiderNavigatorFetchError, SpiderNavigator, SpiderNavigatorFetchResponse } from './navigator';
import { SpiderHandle } from '../handle';


export class SpiderHttpNavigator extends SpiderNavigator {
  protected static readonly recoverableHttpStatuses = [502, 503, 504];


  protected isRecoverableError(err: any): boolean {
    return (
      ((err.request) && (!err.response)) // connection failed
      || (
        // response failed in a recoverable way
        (err.response)
        && (err.response.status)
        && (SpiderHttpNavigator.recoverableHttpStatuses.indexOf(err.response.status) >= 0)
      )
    );
  }


  protected async fetch(target: string, h: SpiderHandle): Promise<SpiderNavigatorFetchResponse> {
    const siteConfig = h.getSiteConfig();

    try {
      const rawResponse = await axios.request(
        {
          url: target,
          method: siteConfig.request.method,
          headers: siteConfig.request.headers,
          responseType: 'arraybuffer',
          responseEncoding: siteConfig.request.responseEncoding,
        } as any,
      );

      return {
        raw: rawResponse,
        data: rawResponse.data.toString(),
      };
    } catch (err) {
      if (!this.isRecoverableError(err)) {
        throw err;
      }

      const newErr = new RecoverableSpiderNavigatorFetchError(err.message);

      (newErr as any).originalError = err;

      throw newErr;
    }
  }
}
