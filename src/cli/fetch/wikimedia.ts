import yargs from 'yargs';
import chalk from 'chalk';

import {
  FetchTaskOptionsInput,
  GutenbergFetchTask,
  GutenbergCatalogFetchTask,
  Task,
} from '../../task';


export function buildFetchWikimedia(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y
    .option(
      'language',
      {
        alias: 'l',
        describe: 'Site language',
        type: 'array',
        default: ['en'],
        choices: [
          // 1M+
          ...['en', 'de', 'es', 'it', 'ja', 'pt', 'ceb', 'se', 'war', 'fr', 'nl', 'pl', 'ru', 'vi', 'zh'],

          // 100K+
          ...[
            'ar', 'az', 'bg', 'zh-min-nan', 'be', 'ca', 'cs', 'da', 'et', 'el', 'eo', 'eu', 'fa', 'gl',
            'hy', 'hi', 'hr', 'id', 'he', 'ka', 'la', 'lt', 'hu', 'mk', 'ms', 'min', 'no', 'nn', 'ce', 'uz',
            'kk', 'ro', 'cy', 'simple', 'sk', 'sl', 'sr', 'sh', 'fi', 'ta', 'th', 'tr', 'azb', 'uk', 'ur',
            'vo', 'ko',
          ].sort(),
        ],
      },
    )
    .option(
      'site',
      {
        alias: 's',
        describe: 'Site type',
        type: 'array',
        default: ['wiki', 'wikibooks', 'wikinews', 'wikiquote', 'wikisource', 'wikiversity', 'wikivoyage', 'wiktionary'],
        choices: ['wiki', 'wikibooks', 'wikinews', 'wikiquote', 'wikisource', 'wikiversity', 'wikivoyage', 'wiktionary'],
      },
    );
}


export async function execFetchGutenberg(argv: yargs.Arguments): Promise<void> {
  const opts: FetchTaskOptionsInput = {
    mode: argv.mode as string,
    basePath: argv.output as string,
    verbosity: Task.getLogLevel(argv.verbosity as string),
  };

  const promises: Promise<any>[] = [];

  if (argv.catalog) {
    const catalogTask = new GutenbergCatalogFetchTask(opts);

    promises.push(catalogTask.run());
  }

  if (argv.library) {
    const libraryTask = new GutenbergFetchTask(opts);

    promises.push(libraryTask.run());
  }

  await Promise.all(promises);

  console.log(`\n##### Download complete! #####\n\nFiles have been stored in ${chalk.bold(opts.basePath as string)}`);
}

