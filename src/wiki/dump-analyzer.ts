import { AccessOptions, Client, FileInfo } from 'basic-ftp';
import _ from 'lodash';
import chalk from 'chalk';
import path from 'path';
import StreamBuffer from 'stream-buffers';

export class WikiDumpAnalyzer {
  private ftpOpts: AccessOptions;

  private baseFtpPath: string;

  public constructor(ftpOpts: AccessOptions, baseFtpPath: string) {
    this.ftpOpts = ftpOpts;
    this.baseFtpPath = baseFtpPath;
  }


  public async getLatestCompletedDumpPath(): Promise<string> {
    const client = new Client();

    await client.access(this.ftpOpts);

    const files = await client.list(this.baseFtpPath);

    const orderedDirs = _.sortBy(
      _.filter(
        files,
        (f: FileInfo) => ((f.type === 2) && (f.name.match(/^[0-9]{8}$/))),
      ),
      'name',
    ).reverse() as FileInfo[];


    for (let index = 0; index < orderedDirs.length; index += 1) {
      const d = orderedDirs[index];
      const pathName = path.join(this.baseFtpPath, d.name);

      try {
        const tempStream = new StreamBuffer.WritableStreamBuffer();

        // eslint-disable-next-line no-await-in-loop
        await client.download(tempStream, path.join(pathName, 'dumpstatus.json'));

        const dumpData = JSON.parse(tempStream.getContentsAsString('utf8') as string);

        if (this.allJobsComplete(dumpData)) {
          client.close();

          return pathName;
        }
      } catch (err) {
        console.error('FTP', err);
      }
    }

    client.close();

    throw new Error(`Could not find a completed dump for Wikimedia site backed up in ${chalk.bold(this.baseFtpPath)}`);
  }


  protected allJobsComplete(dumpData: any): boolean {
    if ((!dumpData) || (!dumpData.jobs) || (_.keys(dumpData.jobs).length < 1)) {
      return false;
    }

    return _.every(dumpData.jobs, j => j.status === 'done');
  }
}

