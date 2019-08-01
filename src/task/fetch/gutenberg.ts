import shelljs from 'shelljs';
import Joi from '@hapi/joi';

import {
  FetchTask,
  FetchTaskMode,
  FetchTaskOptions,
  FetchTaskOptionsInput,
} from './fetch';

import { LogLevel } from '../task';


export interface GutenbergFetchTaskOptionsInput extends FetchTaskOptionsInput {
  withImages?: boolean;
}

export interface GutenbergFetchTaskOptions extends FetchTaskOptions {
  withImages: boolean;
}


export class GutenbergFetchTask extends FetchTask {
  public static INDEX_URL = 'https://www.gutenberg.org/dirs/';

  public static OUTPUT_PATH = 'gutenberg.org';

  public constructor(opts: GutenbergFetchTaskOptionsInput) {
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
        '--reject', (opts.withImages ? 'htm,txt' : 'htm,txt,gif,png,jpg,jpeg,bmp'),
        '--directory-prefix', this.getPath(GutenbergFetchTask.OUTPUT_PATH),
        ...(opts.mode === FetchTaskMode.Continue ? ['--continue'] : []),
        ...(opts.mode === FetchTaskMode.Skip ? ['--no-clobber'] : []),
        ...(this.opts.verbosity >= LogLevel.Warn ? ['--no-verbose', '--show-progress'] : []),
        GutenbergFetchTask.INDEX_URL,
      ],
    );
  }


  protected getOpts(): GutenbergFetchTaskOptions {
    return this.opts as GutenbergFetchTaskOptions;
  }


  protected getOptionsSchema(): Joi.Schema {
    const base = super.getOptionsSchema() as Joi.ObjectSchema;

    return base.keys(
      {
        withImages: Joi.boolean().optional().default(false),
      },
    );
  }
}

