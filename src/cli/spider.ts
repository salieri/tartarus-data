import yargs from 'yargs';
import fs from 'fs';

import { JsonSpiderTask } from '../task/json-spider';
import { Task, TaskOptionsInput } from '../task';

export function buildSpiders(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y
    .command(
      'json',
      'Spider through JSON data',
      // eslint-disable-next-line arrow-body-style
      (yy: yargs.Argv<{}>): yargs.Argv<{}> => {
        return yy
          .option(
            'site',
            {
              alias: 's',
              describe: 'Site description JSON file',
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
          );
      },
      async (argv: yargs.Arguments): Promise<void> => {
        const siteConfig = JSON.parse(fs.readFileSync(argv.site as string, 'utf8'));

        const opts: TaskOptionsInput = {
          basePath: argv.output as string,
          verbosity: Task.getLogLevel(argv.verbosity as string),
        };

        const task = new JsonSpiderTask(opts, siteConfig);

        await task.run();
      },
    )
    .demandCommand();
}
