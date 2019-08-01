import yargs from 'yargs';
import { buildFetchers } from './fetch';

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('td')
  .showHelpOnFail(true)
  .option(
    'verbosity',
    {
      alias: 'V',
      describe: 'Verbosity',
      default: 'warn',
      choices: ['trace', 'debug', 'info', 'warn', 'error', 'panic'],
      requiresArg: true,
    },
  )
  .command(
    'fetch',
    'Data download commands',
    y => buildFetchers(y),
  )
  .wrap(null)
  .demandCommand()
  .argv;
