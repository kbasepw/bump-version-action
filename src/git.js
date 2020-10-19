const execute = require('./execute');

function get_previous_tag(tag_prefix) {
  return execute(`git describe --tags --match="${tag_prefix || 'v'}*" --abbrev=0`)
    .then(result => result.trim())
    .catch(() => null);
}

function get_commits_since(tag) {
  return execute(
    tag ? `git log ${tag}..HEAD` : 'git log')
    .then(response => {
      let commits = [];
      let buffer = [];

      response
        .split('\n')
        .forEach(line => {
          if (line.startsWith('commit ')) {
            if (buffer.length > 0) {
              commits.push(buffer.join('\n'));
              buffer = [];
            }
          }

          buffer.push(line);
        });

      if(buffer.length > 0) {
        commits.push(buffer.join('\n'));
      }

      return commits;
    })
    .catch(() => []);
}

function get_last_commit_id() {
  return execute('git log --format="%H" -n 1')
    .then(stdout => stdout.trim())
    .catch(() => null);
}

function get_commit_tags(commit_id) {
  return execute(`git tag --points-at ${commit_id}`)
    .then(stdout => stdout.trim().split('\n'))
    .catch(() => []);
}

module.exports = {
  get_previous_tag,
  get_commits_since,
  get_last_commit_id,
  get_commit_tags
}


