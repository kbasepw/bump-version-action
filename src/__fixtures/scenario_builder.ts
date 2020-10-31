import {exec} from 'child_process';
import GitRepository from '../git_repository';
import Context, {CommandResult} from '../context';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export default class ScenarioContext implements Context {
  private readonly project_path: string;

  public readonly version_tag_prefix: string = 'v';

  public commit_id: string = '1234';

  public commit_user_name: string = 'Test User';

  public commit_user_email: string = 'user@test';

  readonly commit_message: string = 'release: new release {version} [skip ci]\n\n{changelog}';

  public readonly project_url: string = 'https://github.com/org/project';

  public readonly repository: GitRepository;

  public constructor() {
    this.project_path = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
    this.repository = new GitRepository(this);
  }

  public execute(command_line: string, input?: string): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const proc = exec(
        command_line,
        {
          cwd: this.project_path,
          encoding: 'utf8'
        },
        function(err, output, error) {
          const exit_code = Boolean(err) ? err.code : 0;
          return resolve({ output, error, exit_code });
        });

      if(Boolean(input) && input.length > 0) {
        proc.stdin.write(input, 'utf8');
        proc.stdin.end();
      }
    });
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
    this.write_log('debug', message);
  }

  public info(message: string): void {
    this.write_log('info', message);
  }

  public error(message: string): void {
    this.write_log('error', message);
  }

  public set_output(output: object): void {
    this.write_log('output', JSON.stringify(output));
  }

  public set_failure(error: Error): void {
    this.write_log('failure', JSON.stringify(error));
  }

  private write_log(level: string, message: string): void {
    if(process.env.TEST_DEBUG) {
      console.log(`${level}: ${message}`);
    }
  }

  public async create_git_project(): Promise<void> {
    await this.execute('git init');
    await this.execute('git config user.name "test user"');
    await this.execute('git config user.email "user@example.com"');
  }

  public async create_npm_project(commits: Array<string|ScenarioCommit>): Promise<void> {
    await this.create_git_project();
    await this.execute('npm init -y');
    this.commit_id = await this.repository.commit('initial import', ['package.json'], []);

    if(Boolean(commits)) {
      for(const commit of commits) {
        let message = (commit as ScenarioCommit).message || commit as string;
        let tags = (commit as ScenarioCommit).tags || [];
        await this.write_file('message', message);
        this.commit_id = await this.repository.commit(message, ['message'], tags);
      }
    }
  }
}

interface ScenarioCommit {
  message: string;
  tags?: string[];
};
