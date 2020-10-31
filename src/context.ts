import Repository from './repository';

/**
 * Represents the results of a command execution.
 */
export interface CommandResult {
  readonly output: string;
  readonly error: string;
  readonly exit_code: number;
}

/**
 * Represents the context were the action is running.
 */
export default interface Context {

  /**
   * The prefix for version tag name.
   */
  readonly version_tag_prefix: string;

  /**
   * The commit identifier that trigger this execution.
   */
  readonly commit_id: string;

  /**
   * Returns the repository manager for this context.
   *
   * @returns - A repository manager.
   */
  readonly repository: Repository;

  /**
   * The project base url.
   */
  readonly project_url: string;

  /**
   * Execute the specified command and returns the output.
   *
   * @param command_line - The command line to execute.
   * @param input - The content to send to the command as input.
   * @returns - the command result.
   */
  execute(command_line: string, input?: string): Promise<CommandResult>;

  /**
   * Returns the content of the specified project file or empty if not exists.
   *
   * @param relative_path - The project relative path of the file.
   * @returns - the file content.
   */
  get_file_content_or_empty(relative_path: string): Promise<string>;

  /**
   * Determines if the specified file exists in the current context.
   *
   * @param relative_path - The project relative path of the file.
   * @returns - If the file exists or not.
   */
  exists_file(relative_path: string): Promise<boolean>;

  /**
   * Write the specified file with the specified content.
   *
   * @param relative_path - The project relative path of the file.
   * @param content - The new file content.
   * @returns - If the operation was successful.
   */
  write_file(relative_path: string, content: string): Promise<boolean>;

  /**
   * Write a debug message.
   *
   * @param message - The message text
   */
  debug(message: string): void;

  /**
   * Write a log message.
   *
   * @param message - The message text
   */
  info(message: string): void;

  /**
   * Write an error message.
   *
   * @param message - The message text
   */
  error(message: string): void;

  /**
   * Write object properties as output variables.
   *
   * @param output - The output object.
   */
  set_output(output: object): void;

  /**
   * Notify a failure.
   *
   * @param error - The error object.
   */
  set_failure(error: Error): void;
}
