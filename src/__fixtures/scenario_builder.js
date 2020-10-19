const child_process = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function create_git_project() {
  const project_directory = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
  child_process.execSync('git init', {cwd: project_directory});
  return project_directory;
}

function create_commit(project_directory, commit_message, files, tags) {
  if (!Boolean(files) || files.length === 0) {
    // write some file for the commit
    fs.writeFileSync(path.join(project_directory, 'message'), commit_message);
    child_process.execSync('git add .', {cwd: project_directory});
  } else {
    child_process.execSync('git add ' + files.join(' '), {cwd: project_directory});
  }

  child_process.execSync('git commit -F -', {cwd: project_directory, input: commit_message});
  if(Boolean(tags)) {
    tags
      .forEach(tag => child_process.execSync('git tag ' + tag, {cwd: project_directory}));
  }
}

function create_npm_project(commits) {
  const project_directory = create_git_project();
  child_process.execSync('npm init -y', {cwd: project_directory});
  create_commit(project_directory, 'initial import', ['package.json']);

  if(Boolean(commits)) {
    commits
      .forEach(commit => {
        create_commit(project_directory, commit.message || commit, [], commit.tags);
      });
  }

  return project_directory;
}

module.exports = {
  create_git_project,
  create_npm_project,
  create_commit,
};

