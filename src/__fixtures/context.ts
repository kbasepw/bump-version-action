import Repository from '../repository';
import Context, {CommandResult} from '../context';

export class TestRepository implements Repository {
  public get_last_version_tag_name_before = jest.fn();

  public get_commit = jest.fn();

  public get_all_commits_since_tag = jest.fn();

  public get_tags_pointing_to_commit = jest.fn();

  public commit = jest.fn();

  public push = jest.fn();
}

export default class TestContext implements Context {
  readonly version_tag_prefix: string = 'v';

  public commit_id: string = '1234';

  public commit_user_name: string = 'Test User';

  public commit_user_email: string = 'user@test';

  public commit_message: string = 'release: new version {version} [skip ci]\n\n{changelog}';

  public commit_add: string = '';

  public project_url: string = 'https://github.com/org/project';

  public readonly repository = new TestRepository();

  public execute = jest.fn();

  public get_file_content_or_empty = jest.fn();

  public exists_file = jest.fn();

  public write_file = jest.fn();

  public set_output = jest.fn();

  public set_failure = jest.fn();

  /**
   * Write a debug message.
   *
   * @param message - The message text
   */
  public debug(message: string): void {
  }

  /**
   * Write a log message.
   *
   * @param message - The message text
   */
  public info(message: string): void {
  }

  /**
   * Write an error message.
   *
   * @param message - The message text
   */
  public error(message: string): void {
  }

}
