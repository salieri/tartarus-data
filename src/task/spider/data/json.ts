import { SpiderData } from './data';

export class SpiderJsonData extends SpiderData {
  public parseExec(rawData: string): any {
    return JSON.parse(rawData);
  }
}
