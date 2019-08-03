import csvtojson from 'csvtojson';
import { CSVParseParam } from 'csvtojson/v2/Parameters';

import { SpiderData, SpiderDataOpts } from './data';


export interface CsvSpiderDataOpts extends SpiderDataOpts {
  csvConfig: CSVParseParam;
}

export class SpiderCsvData extends SpiderData {
  // eslint-disable-next-line no-useless-constructor
  public constructor(opts: CsvSpiderDataOpts) {
    super(opts);
  }

  public async parseExec(rawData: string): Promise<any> {
    const opts = this.opts as CsvSpiderDataOpts;

    return csvtojson(opts.csvConfig)
      .fromString(rawData);
  }
}
