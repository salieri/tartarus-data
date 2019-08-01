import { FetchTask, FetchTaskMode, FetchTaskOptionsInput } from './fetch';

export class GutenbergCatalogFetchTask extends FetchTask {
  public static CATALOG_URL = 'http://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2';

  public static OUTPUT_FILE = 'gutenberg.org-catalog-rdf.tar.bz2';

  public constructor(opts: FetchTaskOptionsInput) {
    super('Download Project Gutenberg Library Catalog', opts);

    this.requireBin('wget');
    this.output(GutenbergCatalogFetchTask.OUTPUT_FILE);
  }

  public async run(): Promise<void> {
    const opts = this.getOpts();

    await this.exec(
      'wget',
      [
        '-O', this.getPath(GutenbergCatalogFetchTask.OUTPUT_FILE),
        ...(opts.mode === FetchTaskMode.Continue ? ['--continue'] : []),
        GutenbergCatalogFetchTask.CATALOG_URL,
      ],
    );
  }
}

