import { SpiderData } from './data';

export class SpiderTextData extends SpiderData {
  public parseExec(rawData: string): any {
    return `${rawData}`;
  }
}
