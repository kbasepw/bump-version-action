const util = require('util');

const types = {
  NONE: 3,
  PATCH: 2,
  MINOR: 1,
  MAJOR: 0
}

function parse_commit(text) {
  if (!text || !text.startsWith('commit ')) {
    return null;
  }

  const lines = text.split('\n');
  const header_separator = lines.indexOf('');
  const hash = lines.shift().substring(7).trim();
  const body_lines = lines.slice(header_separator).map(line => line.trim());
  const body = body_lines.join('\n')
  const commit = {
    hash,
    body,
    type: null,
    scope: null,
    message: null,
    badges: []
  };

  let first_line = body_lines[0];
  let match = null;

  do {
    match = (/\s*\[(.*?)\]\s*/gi).exec(first_line);
    if(match) {
      commit.badges.push(match[1].toLowerCase());
      first_line = first_line.replace(match[0], ' ');
    }
  } while(match)

  const parts = (/^((?:\w+|BREAKING CHANGE))(?:\((\w+?)\))?:\s(.*)$/gi).exec(first_line.trim().replace(/\s\s+/g, ' '));
  if(parts) {
    commit.type = parts[1].toLowerCase();
    commit.scope = parts[2];
    commit.message = parts[3];
  }

  if (/BREAKING[\s-]CHANGE/g.test(body)) {
    commit.type = 'breaking-change';
  }

  return commit;
}

function parse_commits(commits) {
  return commits.map(parse_commit);
}

function get_commit_category(commit) {
  commit = util.isString(commit) ? parse_commit(commit) : commit;

  if(!commit) {
    return types.NONE;
  }

  switch(commit.type) {
    case 'breaking-change':
      return types.MAJOR;
    case 'feat':
    case 'feature':
      return types.MINOR;
    case 'fix':
      return types.PATCH;
    default:
      return types.NONE;
  }
}

function get_next_version(start, commits) {
  let bump = commits.map(get_commit_category).reduce((cat, result) => Math.min(cat, result), types.NONE);
  start = start || '0.0.0';

  if(bump === types.NONE) {
    return start;
  }

  const parts = start.split('.');
  parts[bump] = parseInt(parts[bump], 10) + 1;
  while(++bump <= 2) {
    parts[bump] = 0;
  }

  return parts.join('.');
}

module.exports = {
  types,
  parse_commit,
  parse_commits,
  get_commit_category,
  get_next_version
};

