// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpiderDataOpts {}


export interface SpiderParsedData {
  raw: string;
  data: any;
}


export abstract class SpiderData {
  protected opts: SpiderDataOpts;

  public constructor(opts: SpiderDataOpts = {}) {
    this.opts = opts;
  }

  public async parse(rawData: string): Promise<SpiderParsedData> {
    return {
      raw: rawData,
      data: await this.parseExec(rawData),
    };
  }

  public abstract parseExec(rawData: string): Promise<any>|any;
}

