import _ from 'lodash';
import shelljs from 'shelljs';

import { SpiderStore, SpiderStoreOpts } from './store';
import { SpiderHandle } from '../handle';
import { Storable } from './storable';
import { LogLevel } from '../../task';
import { SkippableFetchError } from '../http-fetch';


export type SpiderStorableCallback = (record: any, h: SpiderHandle) => Promise<Storable[]>;


export interface RecordExpanderStoreOpts extends SpiderStoreOpts {
  store: SpiderStorableCallback;
  skipExisting?: boolean;
  skipClearOnFailure?: boolean;
}


export class RecordExpanderStore extends SpiderStore {
  protected opts: RecordExpanderStoreOpts;

  public constructor(opts: RecordExpanderStoreOpts) {
    super(opts);

    this.opts = opts;
  }


  public async save(h: SpiderHandle): Promise<boolean> {
    const data = h.getResponseData();

    if (!data) {
      throw new Error('Missing response data');
    }

    const records = _.castArray(data.data);

    await _.reduce(
      records,
      async (previousPromise: Promise<any>, record: any) => {
        await previousPromise;

        await this.processRecord(record, h);
      },
      Promise.resolve(),
    );

    return true;
  }


  protected async processRecord(record: any, h: SpiderHandle): Promise<void> {
    const storables: Storable[] = _.sortBy(await this.opts.store(record, h), 'priority');
    const siteConfig = h.getSiteConfig();
    const requestDelay = siteConfig.behavior.delay;

    try {
      await _.reduce(
        storables,
        async (previousPromise: Promise<any>, storable: Storable) => {
          await previousPromise;

          if ((!this.opts.skipExisting) || (!storable.exists(this, h))) {
            try {
              await storable.store(this, h);
            } catch (err) {
              if ((!(err instanceof SkippableFetchError)) || (!this.opts.skipClearOnFailure)) {
                throw err;
              }

              h.getSpider().report(
                LogLevel.Info,
                `Skipping ${storable.filename} due to fetch error`,
                _.get(err, 'originalError.response.status'),
              );
            }

            await storable.pause(requestDelay);
          } else {
            h.getSpider().report(LogLevel.Debug, `Skipping ${storable.filename} because it already exists`);
          }
        },
        Promise.resolve(),
      );
    } catch (err) {
      if ((!(err instanceof SkippableFetchError)) || (this.opts.skipClearOnFailure)) {
        throw err;
      }

      this.removeFiles(storables, h);
    }
  }


  protected removeFiles(storables: Storable[], h: SpiderHandle): void {
    _.each(
      storables,
      (storable: Storable) => {
        const fullFilename = storable.getTargetFilename(this, h);

        h.getSpider().report(LogLevel.Info, `Removing ${fullFilename} because it was part of a failed download set`);

        shelljs.rm('-f', fullFilename);
      },
    );
  }
}
