import { Storable } from './storable';
import { SpiderHandle } from '../../handle';
import { SpiderStore } from '../store';


export class StorableFromString extends Storable {
  protected data: string;

  protected encoding: string;

  public constructor(filename: string, data: string, encoding: string = 'utf8') {
    super(filename, 0);

    this.data = data;
    this.encoding = encoding;
  }

  public async store(store: SpiderStore, h: SpiderHandle): Promise<void> {
    await this.writeFile(this.data, store, h, this.encoding);
  }
}
