import {Commit} from './repository';
import Context from './context';

export enum VersionLevel {
  NONE  = 3,
  PATCH = 2,
  MINOR = 1,
  MAJOR = 0
}

export interface ConventionalCommit extends Commit {
  type: string;
  scope: string;
  badges: string[];
  level: VersionLevel;
}

export default class ConventionalSchema {
  private readonly context: Context;
  public readonly commits: ConventionalCommit[];

  public constructor(context: Context, commits: Commit[]) {
    this.context = context;
    this.commits = commits.map(this.to_conventional_commit, this);
  }

  public get_next_version(current_version: string): string {
    current_version = current_version || '0.0.0';
    let bump = this.commits
      .map((commit) => commit.level)
      .reduce((result, level) => Math.min(result, level), VersionLevel.NONE);

    if(bump === VersionLevel.NONE) {
      return current_version;
    }

    let parts = current_version.split('.');
    parts[bump] = (parseInt(parts[bump], 10) + 1).toString();
    while(++bump <= 2) {
      parts[bump] = '0';
    }

    return parts.join('.');
  }

  public async generate_changelog(): Promise<string> {
    const changelog = [];
    const release_notes = await this.context.get_file_content_or_empty('RELEASE_NOTES.md');
    const known_bugs = await this.context.get_file_content_or_empty('KNOWN_BUGS.md');

    if (release_notes) {
      changelog.push(release_notes);
    }

    const sections = this.commits.reduce((result, commit) => {
      result[commit.type] = result[commit.type] || [];
      result[commit.type].push(commit);

      return result;
    }, {});

    const generate_section = (types, title) => {
      const entries = types
        .flatMap((type) => {
          const lines = [];

          if(sections[type] && sections[type].length > 0) {
            sections[type].forEach((commit) => {
              const entry = ['*'];

              const issue = commit.badges.find((badge) => /#\d+/.test(badge));
              if(issue) {
                entry.push(`[${issue}](${this.context.project_url}/issues/${issue.substring(1)})`);
              }

              if (commit.scope && commit.scope.length > 0) {
                entry.push(`**${commit.scope}**:`);
              }

              entry.push(commit.subject);

              if (commit.hash) {
                entry.push(`([commit](${this.context.project_url}/commit/${commit.hash}))`);
              }

              lines.push(entry.join(' '));
            });
          }

          return lines;
        });

      if (entries.length > 0) {
        changelog.push('');
        changelog.push(`${title}`);
        changelog.push(''.padStart(title.length, '-'));
        changelog.push('');
        changelog.push(entries.join('\n'));
      }
    };

    generate_section(['breaking-change'], 'Breaking Changes');
    generate_section(['feature'], 'New features');
    generate_section(['fix'], 'Bug fixes');

    if (known_bugs) {
      changelog.push('');
      changelog.push(known_bugs);
    }

    return changelog.join('\n').trim();
  }

  private to_conventional_commit(commit: Commit): ConventionalCommit {
    let conventional = {
      ...commit,
      type: null,
      scope: null,
      badges: [],
      level: VersionLevel.NONE
    };

    let match = null;
    do {
      match = (/\s*\[(.*?)\]\s*/gi).exec(conventional.subject);
      if(match) {
        conventional.badges.push(match[1].toLowerCase());
        conventional.subject = conventional.subject.replace(match[0], ' ');
      }
    } while(match)

    const parts = (/^((?:\w+|BREAKING CHANGE))(?:\((\w+?)\))?:\s(.*)$/gi)
      .exec(conventional.subject.trim().replace(/\s\s+/g, ' '));
    if(parts) {
      conventional.type = parts[1].toLowerCase();
      conventional.scope = parts[2];
      conventional.subject = parts[3];
    }

    if (/BREAKING[\s-]CHANGE/g.test(conventional.body)) {
      conventional.type = 'breaking-change';
    }

    switch(conventional.type) {
      case 'breaking change':
      case 'breaking-change':
        conventional.type = 'breaking-change';
        conventional.level = VersionLevel.MAJOR;
        break;
      case 'feat':
      case 'feature':
        conventional.type = 'feature';
        conventional.level = VersionLevel.MINOR;
        break;
      case 'fix':
        conventional.level = VersionLevel.PATCH;
        break;
      default:
        conventional.level = VersionLevel.NONE;
        break;
    }

    return conventional;
  }
}

