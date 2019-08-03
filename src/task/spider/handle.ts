import { AxiosResponse } from 'axios';
import { SpiderParsedData } from './data';
import { SpiderSiteConfig, SpiderTask } from './spider';


export class SpiderHandle {
  protected task: SpiderTask;

  protected iteration: number;

  protected response: AxiosResponse | null;

  protected responseData: SpiderParsedData | null;


  public constructor(
    task: SpiderTask,
    iteration: number,
    response: AxiosResponse | null,
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


  public getResponse(): AxiosResponse | null {
    return this.response;
  }


  public getBaseUrl(): string {
    return this.getSiteConfig().navigator.getBaseUrl();
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
}
