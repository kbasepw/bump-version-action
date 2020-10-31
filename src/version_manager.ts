import Repository from './repository';
import Context, {CommandResult} from './context';
import ConventionalSchema from './conventional';
import NpmProjectType from './project_npm';
import ProjectType, {ProjectTypeEntry, ProjectTypeConstructor} from './project';
import VersionInfo from './version_info';

export default class VersionManager {
  private readonly context: Context;

  private readonly project_types: ProjectTypeEntry[] = [
    {
      name: 'npm',
      Type: NpmProjectType
    }
  ];

  public constructor(context: Context) {
    this.context = context;
  }

  public async bump_version(): Promise<VersionInfo> {
    const version_info: VersionInfo = {
      current_version: null,
      version: null,
      commit_id: null,
      subject: null,
      changelog: null
    };

    this.context.debug('retrieving last commit id ...');
    version_info.commit_id = this.context.commit_id;
    this.context.info(`evaluating commit ${version_info.commit_id}`);

    this.context.debug('retrieving tags last commit ...');
    const commit_tags = await this.context.repository.get_tags_pointing_to_commit(version_info.commit_id);
    this.context.debug(`commit tags: ${commit_tags.join(', ')}`);

    const version_tag = commit_tags.find(tag => tag.startsWith(this.context.version_tag_prefix));
    if (version_tag) {
      this.context.info(`last commit already has a version tag: ${version_tag}`);

      const commit = await this.context.repository.get_commit(version_info.commit_id);
      version_info.current_version = version_tag.substring(this.context.version_tag_prefix.length);
      version_info.version = version_info.current_version;
      version_info.subject = commit.subject;
      version_info.changelog = commit.body;
      this.context.info(`version from commit: ${version_info.version}`);
    } else {
      this.context.debug('retrieving last version tag ...')
      const last_tag = await this.context.repository.get_last_version_tag_name_before(version_info.commit_id);
      this.context.debug(`found: ${last_tag || '<no previous version tag found>'}`);

      this.context.debug(`retrieving commits since ${last_tag || 'ever'} ...`)
      const raw_commits = await this.context.repository.get_all_commits_since_tag(last_tag);
      this.context.debug(`found: ${raw_commits.length} commits ...`);

      this.context.debug('calculating next version ...')
      const schema = new ConventionalSchema(this.context, raw_commits);
      version_info.current_version = last_tag ? last_tag.substring(1) : '0.0.0';
      version_info.version = schema.get_next_version(version_info.current_version);
      version_info.changelog = await schema.generate_changelog();

      this.context.info(`current version: ${version_info.current_version}`);
      this.context.info(`bump version: ${version_info.version}`);

      this.context.debug('updating project version ...');
      const modified_files = (await Promise.all(this.project_types
        .map((entry) => ({...entry, project: new entry.Type(this.context)}))
        .filter((entry) => entry.project.is_enabled())
        .map((entry) => {
          this.context.info(`found project type: ${entry.name}`);
          return entry.project.update_version(version_info);
        }))).reduce((list, item) => list.concat(item), []);

      this.context.debug('committing changes ...');
      const commit_message = [
        `release: new release ${version_info.version} [skip ci]`,
        '',
        version_info.changelog
      ].join('\n');

      version_info.commit_id = await this.context.repository.commit(
        commit_message,
        modified_files,
        [this.context.version_tag_prefix + version_info.version]
      );

      await this.context.repository.push();
    }

    return version_info;
  }
}
