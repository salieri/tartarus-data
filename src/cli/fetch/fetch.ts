import * as yargs from 'yargs';
import { buildFetchGutenberg, execFetchGutenberg } from './gutenberg';

export function buildFetchers(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y
    .option(
      'mode',
      {
        alias: 'm',
        describe: 'Download mode for existing files',
        default: 'skip',
        choices: ['continue', 'skip', 'force'],
        type: 'string',
        requiresArg: true,
      },
    )
    .option(
      'output',
      {
        alias: 'o',
        describe: 'Output path',
        default: process.env.TARTARUS_DATA_PATH || '~/tartarus-data-files',
        type: 'string',
        requiresArg: true,
      },
    )
    .command(
      'gutenberg',
      'Download Project Gutenberg Library',
      buildFetchGutenberg,
      execFetchGutenberg,
    )
    .demandCommand();
}
