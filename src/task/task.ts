import untildify from 'untildify';
import Joi from '@hapi/joi';
import path from 'path';
import chalk from 'chalk';
import shelljs from 'shelljs';
import execa from 'execa';
import shellescape from 'shell-escape';

export interface TaskOptionsInput {
  basePath?: string;
  verbosity?: number;

  dryRun?: boolean;
}

export interface TaskOptions {
  basePath: string;
  verbosity: number;

  dryRun: boolean;
}

export enum LogLevel {
  Panic = 50,
  Error = 40,
  Warn = 30,
  Info = 20,
  Debug = 10,
  Trace = 0
}

export const taskOptionsSchema = Joi.object().keys(
  {
    basePath: Joi.string().optional().default(process.env.TARTARUS_DATA_PATH || '~/tartarus-data-files'),
    verbosity: Joi.number().optional().default(LogLevel.Warn),
    dryRun: Joi.boolean().optional().default(false),
  },
);

export abstract class Task {
  protected readonly name: string;

  protected readonly opts: TaskOptions;

  protected shouldSkip = false;

  public constructor(name: string, opts: TaskOptionsInput = {}) {
    this.name = name;
    this.opts = this.prepareOptions(opts);
  }

  public abstract run(): Promise<void>;


  protected prepareOptions(opts: TaskOptionsInput): TaskOptions {
    const finalOpts = Joi.validate(opts, this.getOptionsSchema());

    if (finalOpts.error) {
      throw finalOpts.error;
    }

    finalOpts.value.basePath = untildify(finalOpts.value.basePath as string);

    return finalOpts.value as TaskOptions;
  }


  protected getOptionsSchema(): Joi.Schema {
    return taskOptionsSchema;
  }


  protected getPath(relativePath: string): string {
    return path.join(this.opts.basePath, relativePath);
  }


  protected requireBin(binName: string): void {
    if (!shelljs.which(binName)) {
      throw new Error(`Could not locate ${chalk.bold(binName)}. Please make sure it has been installed and accessible via PATH.`);
    }
  }


  protected skip(): void {
    this.shouldSkip = true;
  }


  protected async exec(cmd: string, args: string[] = [], canFail: boolean = false): Promise<execa.ExecaReturnValue<string>|null> {
    const cmdStr = `${cmd} ${shellescape(args)}`;

    this.report(LogLevel.Debug, `${chalk.bold('CMD>')} ${cmdStr}`);

    if (this.shouldSkip) {
      this.report(LogLevel.Debug, `Skipping ${chalk.bold(cmdStr)}`);
      return null;
    }

    if (this.opts.dryRun) {
      this.report(LogLevel.Debug, `Dry run mode, not executing ${chalk.bold(cmdStr)}`);
      return null;
    }

    shelljs.mkdir('-p', this.opts.basePath);

    const execaOpts = {
      cwd: this.opts.basePath,
      stdio: 'inherit',
    };

    const p = execa(cmd, args, execaOpts as any);

    // if ((this.opts.verbosity <= LogLevel.Info)) {
    //   p.stdout!.pipe(process.stdout);
    //  p.stderr!.pipe(process.stderr);
    // }

    const result = await p;

    if (
      (
        (result.exitCode !== 0)
        || (result.killed)
        || (result.failed)
        || (result.isCanceled)
      )
      && (!canFail)) {
      throw new Error(`Execution failed on ${chalk.bold(cmdStr)}\n\n${result.stderr}`);
    }

    return result;
  }


  protected report(level: LogLevel, ...reportData: any[]): void {
    if (level < this.opts.verbosity) {
      return;
    }

    console.log(...reportData);
  }


  protected getOpts(): TaskOptions {
    return this.opts;
  }


  public static getLogLevel(level: string): LogLevel {
    const levelName = `${level.substr(0, 1).toUpperCase()}${level.substr(1).toLowerCase()}`;

    if (!(levelName in LogLevel)) {
      throw new Error(`Unknown log level '${level}'`);
    }

    return LogLevel[levelName as keyof typeof LogLevel];
  }
}
