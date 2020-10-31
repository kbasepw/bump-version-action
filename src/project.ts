import Context from './context';
import VersionInfo from './version_info';

/**
 * Represents a type of project.
 */
export default abstract class ProjectType {
  protected readonly context: Context;

  /**
   * Initialize a new instance for the specified context.
   *
   * @param context - The current context.
   */
  public constructor(context: Context) {
    this.context = context;
  }

  /**
   * Determines if the current repository has this type of project.
   *
   * @returns - if this project type is enabled in the current context.
   */
  abstract is_enabled(): Promise<boolean>;

  /**
   * Update the project version and returns the modified files
   *
   * @param version_info - The version information.
   * @returns - The relative paths of the affected files.
   */
  abstract update_version(version_info: VersionInfo): Promise<string[]>;
}

export interface ProjectTypeConstructor {
  new(context: Context): ProjectType;
}

export interface ProjectTypeEntry {
  readonly name: string;
  readonly Type: ProjectTypeConstructor;
}

