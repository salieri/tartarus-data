import fs from 'fs';
import chalk from 'chalk';
import Joi from '@hapi/joi';
import _ from 'lodash';

import {
  LogLevel,
  Task,
  TaskOptions,
  TaskOptionsInput,
} from '../task';

export enum FetchTaskMode {
  Continue = 'continue',
  Skip = 'skip',
  Force = 'force'
}

export interface FetchTaskOptions extends TaskOptions {
  mode: string;
}

export interface FetchTaskOptionsInput extends TaskOptionsInput {
  mode?: string;
}


export abstract class FetchTask extends Task {
  protected output(relativePath: string): void {
    const absolutePath = this.getPath(relativePath);

    const opts = this.getOpts();

    if ((fs.existsSync(absolutePath)) && (opts.mode !== FetchTaskMode.Force)) {
      if (opts.mode === FetchTaskMode.Skip) {
        this.report(LogLevel.Warn, `${chalk.bold(absolutePath)} exists -- skipping ${chalk.bold(this.name)}`);

        this.skip();
        return;
      }

      throw new Error(
        `Output path ${chalk.bold(absolutePath)} already exists (use ${chalk.bold(`--mode=${FetchTaskMode.Force}`)} to override)`,
      );
    }
  }


  protected getOpts(): FetchTaskOptions {
    return this.opts as FetchTaskOptions;
  }


  protected getOptionsSchema(): Joi.Schema {
    const base = super.getOptionsSchema() as Joi.ObjectSchema;

    return base.keys(
      {
        mode: Joi.string().optional().default('skip').valid(_.values(FetchTaskMode)),
      },
    );
  }
}

