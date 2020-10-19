jest.mock('./execute');

const execute = require('./execute');
const fs = require('fs');
const path = require('path');
const git = require('./git');

const all_commits = fs.readFileSync(path.resolve(__dirname, '__fixtures', 'commits.txt'), { encoding: 'utf-8' }).split('--\n');

describe('git', function() {

  describe('get_previous_tag', function() {

    it('should return git last tag', async function() {
      const expected = 'v1.0.0';
      execute.mockResolvedValue(expected + '\n');

      const result = await git.get_previous_tag('v');
      expect(result).toEqual(expected);
    });

    it('should return null if no previous tags', async function() {
      execute.mockRejectedValue(new Error('fatal: No names found, cannot describe anything.'));

      const result = await git.get_previous_tag();
      expect(result).toBeNull();
    });

  });

  describe('get_commits_since', function() {

    const last_tag = 'v1.0.0'
    const commits_since_last_tag = all_commits.slice(0, 4);

    it.each([
      [undefined, all_commits],
      [null, all_commits],
      [last_tag, commits_since_last_tag],
    ])('should return the correct commits for tag: %s', async function(tag, expected) {
      execute.mockImplementation((command) => {
        if (command === 'git log') {
          return Promise.resolve(all_commits.join('\n'));
        } else if(command === `git log ${tag}..HEAD`) {
          return Promise.resolve(commits_since_last_tag.join('\n'));
        } else {
          return Promise.resolve('\n');
        }
      });

      const result = await git.get_commits_since(tag);
      expect(result).toEqual(expected);
    });

  });

  describe('get_last_commit_id', function() {

    it('should return the commit id of the last commit', async function() {
      const last_commit = 'bf8ea1c74183b3f07e5524eb27cb56c2d885c879';
      execute.mockResolvedValue(last_commit + '\n');

      const result = await git.get_last_commit_id();
      expect(result).toEqual(last_commit);
    });

  });

  describe('get_commit_tags', function() {

    it('should return the tags pointing to the specific commit id', async function() {
      const last_commit = 'bf8ea1c74183b3f07e5524eb27cb56c2d885c879';
      const tags = ['v1.0.0', 'some_other_tag']

      execute.mockImplementation((command) => {
        if (command === `git tag --points-at ${last_commit}`) {
          return Promise.resolve(tags.join('\n') + '\n');
        } else {
          return Promise.reject(new Error('No tags'));
        }
      });

      const result = await git.get_commit_tags(last_commit);
      expect(result).toEqual(tags);
    });

  });

});

