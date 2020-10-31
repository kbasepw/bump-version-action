
export interface Commit {
  hash: string;
  headers: Map<string, string>;
  subject: string;
  body: string;
}

/**
 * Represents the interface with the project repository.
 */
export default interface Repository {

  get_last_version_tag_name_before(commit_id: string): Promise<string>;

  get_commit(commit_id: string): Promise<Commit>;

  get_all_commits_since_tag(tag_name: string): Promise<Commit[]>;

  get_tags_pointing_to_commit(commit_id: string): Promise<string[]>;

  commit(message: string, files: string[], tags: string[]): Promise<string>;

  push(): Promise<void>;
}
