import Context from './context';
import Repository, {Commit} from './repository';

export default class GitRepository implements Repository {
  private readonly context: Context;

  public constructor(context: Context) {
    this.context = context;
  }

  public async get_last_version_tag_name_before(commit_id: string): Promise<string> {
    const result = await this.context.execute(`git describe --tags --match="${this.context.version_tag_prefix}*" --abbrev=0`);

    if (result.exit_code !== 0) {
      return null;
    }

    return result.output.trim();
  }

  public async get_commit(commit_id: string): Promise<Commit> {
    const result = await this.context.execute(`git show --no-patch ${commit_id}`);
    if (result.exit_code !== 0) {
      return null;
    }

    return this.parse_commit(result.output);
  }

  public async get_all_commits_since_tag(tag_name: string): Promise<Commit[]> {
    const result = await this.context.execute(Boolean(tag_name)
      ? `git log ${tag_name}..HEAD`
      : 'git log');

    if (result.exit_code !== 0) {
      return [];
    }

    let commits = [];
    let buffer = [];

    result.output
      .split('\n')
      .forEach(line => {
        if (line.startsWith('commit ')) {
          if (buffer.length > 0) {
            commits.push(this.parse_commit(buffer.join('\n').trim()));
            buffer = [];
          }
        }

        buffer.push(line);
      });

    if(buffer.length > 0) {
      commits.push(this.parse_commit(buffer.join('\n').trim()));
    }

    return commits.filter(Boolean);
  }

  public async get_tags_pointing_to_commit(commit_id: string): Promise<string[]> {
    const result = await this.context.execute(`git tag --points-at ${commit_id}`);

    if (result.exit_code !== 0) {
      return [];
    }

    return result.output.trim().split('\n');
  }

  private parse_commit(raw_commit: string): Commit {
    if(!Boolean(raw_commit) || raw_commit.length === 0) {
      return null;
    }

    if (!raw_commit.startsWith('commit')) {
      throw new Error('malformed commit: ' + raw_commit);
    }

    const lines = raw_commit.split('\n');
    let commit = {
      hash: lines.shift().substring(6).trim(),
      headers: new Map(),
      subject: '',
      body: ''
    };
    const body_lines = [];

    let part = 0;
    lines.forEach((line: string) => {
      if (line === '') {
        if (part === 0) {
          part = 1;
        } else if (part === 1) {
          part = 2;
        } else {
          body_lines.push(line);
        }
      } else {
        switch(part) {
          case 0:
            const [key] = line.split(':', 2);
            commit.headers.set(key.trim(), line.substring(key.length + 1).trim());
            break;
          case 1:
            commit.subject = line.trim();
            part = 2;
            break;
          default:
            body_lines.push(line);
            break;
        }
      }
    });

    commit.body = body_lines.join('\n').trim();
    return commit;
  }

  public async commit(message: string, files: string[], tags: string[]): Promise<string> {
    const files_list = Boolean(files) && files.length > 0 ? files.join(' ') : '.';
    const add_result = await this.context.execute(`git add ${files_list}`);
    if(add_result.exit_code !== 0) {
      throw new Error('Unable to add files to commit: ' + add_result.error);
    }

    await this.context.execute(`git config user.name ${this.context.commit_user_name}`);
    await this.context.execute(`git config user.email ${this.context.commit_user_email}`);

    const result = await this.context.execute('git commit -F -', message);
    if(result.exit_code !== 0) {
      throw new Error('unable to create commit: ' + result.error);
    }

    const commit_id = await this.context.execute('git rev-parse HEAD');

    if (Boolean(tags)) {
      await Promise.all(tags.map(tag => {
        return this.context.execute(`git tag -a ${tag} -m '' ${commit_id.output}`);
      }));
    }

    return commit_id.output;
  }

  public async push(): Promise<void> {
    const result = await this.context.execute('git push --tags');

    if (result.exit_code !== 0) {
      this.context.info('unable to push to remote: ' + result.output + result.error);
    }
  }
}
