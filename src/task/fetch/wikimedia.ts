import path from 'path';
import shelljs from 'shelljs';
import Joi from '@hapi/joi';
import chalk from 'chalk';

import {
  FetchTask,
  FetchTaskMode,
  FetchTaskOptions,
  FetchTaskOptionsInput,
} from './fetch';

import { WikiDumpAnalyzer } from '../../wiki/dump-analyzer';
import { LogLevel } from '../task';

export interface WikimediaFetchTaskOptions extends FetchTaskOptions {
  lang: string;
  siteType: string;
}

export interface WikimediaFetchTaskOptionsInput extends FetchTaskOptionsInput {
  lang: string;
  siteType: string;
}

export class WikimediaFetchTask extends FetchTask {
  public static WIKI_DUMP_HOST = 'ftpmirror.your.org';

  public static WIKI_DUMP_BASE_PATH = '/pub/wikimedia/dumps';

  public static WIKI_OUTPUT_PATH = 'wikimedia';


  public constructor(opts: WikimediaFetchTaskOptionsInput) {
    super(`Download Wikimedia Backup ${opts.lang}${opts.siteType}`, opts);

    this.requireBin('wget');
    this.output(this.getOutputPath());
  }


  public async run(): Promise<void> {
    const dumpPath = await this.getDumpPath();
    const outputPath = this.getOutputPath();
    const dumpUrl = `ftp://${WikimediaFetchTask.WIKI_DUMP_HOST}${dumpPath}`;

    this.report(LogLevel.Info, `Latest complete dump in ${chalk.bold(dumpPath)}`);

    const opts = this.getOpts();

    if (opts.mode === FetchTaskMode.Force) {
      shelljs.rm('-rf', outputPath);
    }

    shelljs.mkdir('-p', this.getPath(WikimediaFetchTask.WIKI_DUMP_BASE_PATH));

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
        '--directory-prefix', outputPath,
        ...(opts.mode === FetchTaskMode.Continue ? ['--continue'] : []),
        ...(opts.mode === FetchTaskMode.Skip ? ['--no-clobber'] : []),
        ...(this.opts.verbosity >= LogLevel.Warn ? ['--no-verbose', '--show-progress'] : []),
        dumpUrl,
      ],
    );
  }


  protected getOutputPath(): string {
    const opts = this.getOpts();

    return this.getPath(path.join(WikimediaFetchTask.WIKI_OUTPUT_PATH, `${opts.lang}${opts.siteType}`));
  }


  protected async getDumpPath(): Promise<string> {
    const opts = this.getOpts();

    const analyzer = new WikiDumpAnalyzer(
      {
        host: WikimediaFetchTask.WIKI_DUMP_HOST,
      },
      path.join(
        WikimediaFetchTask.WIKI_DUMP_BASE_PATH,
        `${opts.lang}${opts.siteType}`,
      ),
    );

    return analyzer.getLatestCompletedDumpPath();
  }


  protected getOpts(): WikimediaFetchTaskOptions {
    return this.opts as WikimediaFetchTaskOptions;
  }


  protected getOptionsSchema(): Joi.Schema {
    const base = super.getOptionsSchema() as Joi.ObjectSchema;

    return base.keys(
      {
        lang: Joi.string().required(),
        siteType: Joi.string().required(),
      },
    );
  }
}
