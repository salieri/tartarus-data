import _ from 'lodash';

import { SpiderStore, SpiderStoreOpts } from './store';
import { SpiderHandle } from '../handle';
import { Storable } from './storable';
import { LogLevel } from '../../task';


export type SpiderStorableCallback = (record: any, h: SpiderHandle) => Promise<Storable[]>;


export interface RecordExpanderStoreOpts extends SpiderStoreOpts {
  store: SpiderStorableCallback;
  skipExisting?: boolean;
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

    await _.reduce(
      storables,
      async (previousPromise: Promise<any>, storable: Storable) => {
        await previousPromise;

        if ((!this.opts.skipExisting) || (!storable.exists(this, h))) {
          await storable.store(this, h);
          await storable.pause(requestDelay);
        } else {
          h.getSpider().report(LogLevel.Debug, `Skipping ${storable.filename} because it already exists`);
        }
      },
      Promise.resolve(),
    );
  }
}
