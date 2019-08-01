import yargs from 'yargs';
import chalk from 'chalk';

import {
  FetchTaskOptionsInput,
  GutenbergFetchTask,
  GutenbergCatalogFetchTask,
  Task,
} from '../../task';


export function buildFetchGutenberg(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y
    .option(
      'library',
      {
        alias: 'l',
        describe: 'Download library',
        type: 'boolean',
        default: true,
      },
    )
    .option(
      'catalog',
      {
        alias: 'c',
        describe: 'Download catalog',
        type: 'boolean',
        default: false,
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

