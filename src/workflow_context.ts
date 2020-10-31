import Context, {CommandResult} from './context';
import {exec} from '@actions/exec';
import GitRepository from './git_repository';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';


export default class WorkflowContext implements Context {
  private project_path: string;
  public readonly repository: GitRepository;

  public constructor() {
    this.project_path = process.cwd();
    this.repository = new GitRepository(this);
  }

  public get commit_id(): string {
    return process.env.GITHUB_SHA;
  }

  public get version_tag_prefix(): string {
    return core.getInput('version-tag-prefix');
  }

  public get commit_user_name(): string {
    let value = core.getInput('commit-user-name');
    
    if(!Boolean(value) || value.length === 0) {
      value = process.env.GITHUB_ACTOR;
    }

    return value;
  }

  public get commit_user_email(): string {
    let value = core.getInput('commit-user-email');
    
    if(!Boolean(value) || value.length === 0) {
      const name = this.commit_user_name;
      const repo = process.env.GITHUB_REPOSITORY;
      value = `${name}@${repo.substring(0, repo.indexOf('/'))}`
    }

    return value;
  }

  public get commit_message(): string {
    return core.getInput('commit-message');
  }

  public get project_url(): string {
    return process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY;
  }

  public async execute(command_line: string, input?: string): Promise<CommandResult> {
    let output = '';
    let error = '';
    let exit_code = 0;

    const options = {
      silent: true,
      cwd: this.project_path,
      input: Buffer.from(input || '', 'utf8'),
      listeners: {
        stdout: (data) => { output += data.toString(); },
        stderr: (data) => { error  += data.toString(); }
      }
    };

    try {
      exit_code = await exec(command_line, undefined, options);
    } catch(e) {
      exit_code = e.code || 128;
    }

    return {
      output,
      error,
      exit_code,
    };
  }

  public get_file_content_or_empty(relative_path: string): Promise<string> {
    return new Promise((resolve) => {
      fs.readFile(path.join(this.project_path, relative_path), {encoding: 'utf8'}, (error, data) => {
        if(error) {
          resolve('');
        } else {
          resolve(data.toString());
        }
      });
    });
  }

  public exists_file(relative_path: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(path.join(this.project_path, relative_path), (error) => {
        resolve(!Boolean(error));
      });
    })
  }

  public write_file(relative_path: string, content: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.writeFile(path.join(this.project_path, relative_path), content, { encoding: 'utf8' }, (error) => {
        if(Boolean(error)) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  public debug(message: string): void {
    core.debug(message);
  }

  public info(message: string): void {
    core.info(message);
  }

  public error(message: string): void {
    core.error(message);
  }

  public set_output(output: object): void {
    Object.entries(output)
      .forEach(([key, value]) => core.setOutput(key, value));
  }

  public set_failure(error: Error): void {
    core.setFailed(error.message);
  }
}
