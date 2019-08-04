import { SpiderParsedData } from './data';
import { SpiderSiteConfig, SpiderTask } from './spider';
import { SpiderNavigatorFetchResponse } from './navigator';


export class SpiderHandle {
  protected task: SpiderTask;

  protected iteration: number;

  protected response: SpiderNavigatorFetchResponse | null;

  protected responseData: SpiderParsedData | null;


  public constructor(
    task: SpiderTask,
    iteration: number,
    response: SpiderNavigatorFetchResponse | null,
    responseData: SpiderParsedData | null,
  ) {
    this.task = task;
    this.iteration = iteration;
    this.response = response;
    this.responseData = responseData;
  }

  public getResponseData(): SpiderParsedData | null {
    return this.responseData;
  }


  public getResponse(): SpiderNavigatorFetchResponse | null {
    return this.response;
  }


  public getBaseTarget(): string {
    return this.getSiteConfig().navigator.getBaseTarget();
  }


  public getIteration(): number {
    return this.iteration;
  }


  public getPath(filename: string): string {
    return this.task.toPath(filename);
  }


  public getSiteConfig(): SpiderSiteConfig {
    return this.task.getSiteConfig();
  }


  public getSpider(): SpiderTask {
    return this.task;
  }
}
