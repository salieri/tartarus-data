import yargs from 'yargs';
import untildify from 'untildify';

import { SpiderTask } from '../task/spider';
import { Task, TaskOptionsInput } from '../task';

export function buildSpider(y: yargs.Argv<{}>): yargs.Argv<{}> {
  return y
    .option(
      'site',
      {
        alias: 's',
        describe: 'Site definition TypeScript or JavaScript file',
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
}

export async function execSpider(argv: yargs.Arguments): Promise<void> {
  const siteDefinition = (await import(untildify(argv.site as string))).default;

  const opts: TaskOptionsInput = {
    basePath: argv.output as string,
    verbosity: Task.getLogLevel(argv.verbosity as string),
  };

  const task = new SpiderTask(opts, siteDefinition);

  await task.run();
}

