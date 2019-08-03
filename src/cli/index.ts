#!/usr/bin/env node

import yargs from 'yargs';
import { buildFetchers } from './fetch';
import { buildSpider, execSpider } from './spider';

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
    buildFetchers,
  )
  .command(
    'spider',
    'Data spider commands',
    buildSpider,
    execSpider,
  )
  .wrap(null)
  .demandCommand()
  .argv;
