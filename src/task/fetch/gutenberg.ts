import shelljs from 'shelljs';

import { FetchTask, FetchTaskMode, FetchTaskOptionsInput } from './fetch';
import { LogLevel } from '../task';

export class GutenbergFetchTask extends FetchTask {
  public static INDEX_URL = 'https://www.gutenberg.org/dirs/';

  public static OUTPUT_PATH = 'gutenberg.org';

  public constructor(opts: FetchTaskOptionsInput) {
    super('Download Project Gutenberg Library', opts);

    this.requireBin('wget');
    this.output(GutenbergFetchTask.OUTPUT_PATH);
  }

  public async run(): Promise<void> {
    const opts = this.getOpts();

    if (opts.mode === FetchTaskMode.Force) {
      shelljs.rm('-rf', this.getPath(GutenbergFetchTask.OUTPUT_PATH));
    }

    await this.exec(
      'wget',
      [
        '-e', 'robots=off',
        '--mirror',
        '--convert-links',
        '--adjust-extension',
        '--page-requisites',
        '--no-host-directories',
        '--timestamping',
        '--include', '/dirs,/files',
        '--reject', 'htm,txt',

        '--directory-prefix', this.getPath(GutenbergFetchTask.OUTPUT_PATH),
        ...(opts.mode === FetchTaskMode.Continue ? ['--continue'] : []),
        ...(opts.mode === FetchTaskMode.Skip ? ['--no-clobber'] : []),
        ...(this.opts.verbosity >= LogLevel.Warn ? ['--no-verbose', '--show-progress'] : []),
        GutenbergFetchTask.INDEX_URL,
      ],
    );
  }
}

