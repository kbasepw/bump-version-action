import GitRepository from './git_repository';
import TestContext from './__fixtures/context';

describe('GitRepository', () => {
  describe('get_last_version_tag_name_before', () => {
    it('should return last tag name', async () => {
      const commit_id = '12345';
      const expected = 'v0.1.0';
      const context = new TestContext();
      context.execute.mockResolvedValue({
        output: `${expected}\n`,
        error: '',
        exit_code: 0
      });

      const repository = new GitRepository(context);
      const result = await repository.get_last_version_tag_name_before(commit_id);

      expect(result).toEqual(expected);
    });

    it('should return null if there is no previous tag', async () => {
      const commit_id = '12345';
      const expected = null;
      const context = new TestContext();
      context.execute.mockResolvedValue({
        output: '',
        error: 'fatal: No names found, cannot describe anything',
        exit_code: 128
      });

      const repository = new GitRepository(context);
      const result = await repository.get_last_version_tag_name_before(commit_id);

      expect(result).toEqual(expected);
    });
  });

  describe('get_commit', () => {
    it('should return the commit', async () => {
      const commit = {
        "hash": "99af074078f0085ef538493d4d4ba7b6ccd45808",
        "headers": new Map(Object.entries({
          "Author": "John Doe <john.doe@example.com>",
          "Date": "Fri Sep 25 23:58:35 2020 +0100"
        })),
        "subject": "[#3761] fix: use custom init function",
        "body": "some details about the fix"
      };
      const context = new TestContext();
      context.execute.mockImplementation((command) => {
        if (command === `git show --no-patch ${commit.hash}`) {
          return Promise.resolve({
            output: `
  commit ${commit.hash}
  ${Array.from(commit.headers, ([key, value]) => `${key}: ${value}`).join('\n')}

  ${commit.subject}

  ${commit.body}
          `.trim(),
            error: '',
            exit_code: 0
          });
        }

        return Promise.resolve({
          output: '',
          error: 'fatal: ambiguous argument',
          exit_code: 128
        });
      });


      const repository = new GitRepository(context);
      const result = await repository.get_commit(commit.hash);

      expect(result).toEqual(commit);
    });
  });

  describe('get_all_commits_since_tag', () => {
    const all_commits = [
      {
        "hash": "99af074078f0085ef538493d4d4ba7b6ccd45808",
        "headers": new Map(Object.entries({
          "Author": "John Doe <john.doe@example.com>",
          "Date": "Fri Sep 25 23:58:35 2020 +0100"
        })),
        "subject": "[#3761] fix: use custom init function",
        "body": "some details about the fix"
      },
      {
        "hash": "2264916fc26b82fbd8dfaf7aaecc56518870505b",
        "headers": new Map(Object.entries({
          "Author": "John Doe <john.doe@example.com>",
          "Date": "Mon Sep 14 23:48:53 2020 +0100"
        })),
        "subject": "chore: upgrade dependency to 9.15.10",
        "body": ""
      },
      {
        "hash": "7e1be08aced052592b8d18d5b05717302b3341f0",
        "headers": new Map(Object.entries({
          "Author": "John Doe <john.doe@example.com>",
          "Date": "Wed Sep 9 23:55:09 2020 +0100"
        })),
        "subject": "feat: use more robust implementation of feature XYZ",
        "body": ""
      }
    ];
    const last_tag = 'v1.0.0'
    const commits_since_last_tag = all_commits.slice(0, 1);
    const context = new TestContext();
    context.execute.mockImplementation((command) => {
      const output = (command === `git log ${last_tag}..HEAD`)
        ? commits_since_last_tag
        : (command === 'git log')
          ? all_commits
          : [];

      return Promise.resolve({
        output: output.map(commit => `
commit ${commit.hash}
${Array.from(commit.headers, ([key, value]) => `${key}: ${value}`).join('\n')}

${commit.subject}

${commit.body}
        `.trim()).join('\n'),
        error: '',
        exit_code: 0
      });
    });

    it.each([
      [undefined, all_commits],
      [null, all_commits],
      [last_tag, commits_since_last_tag],
    ] as any)
    ('should return the correct commits for tag: %s', async (tag_name, expected) => {
      const repository = new GitRepository(context);
      const result = await repository.get_all_commits_since_tag(tag_name);

      expect(result).toEqual(expected);
    });
  });

  describe('get_tags_pointing_to_commit', () => {
    it('should return the tags pointing to the specific commit id', async function() {
      const commit_id = 'bf8ea1c74183b3f07e5524eb27cb56c2d885c879';
      const tags = ['v1.0.0', 'some_other_tag']
      const context = new TestContext();
      context.execute.mockImplementation((command) => {
        if (command === `git tag --points-at ${commit_id}`) {
          return Promise.resolve({
            output: tags.join('\n') + '\n',
            error: '',
            exit_code: 0
          });
        } else {
          return Promise.resolve({
            output: '',
            error: '',
            exit_code: 0
          });
        }
      });

      const repository = new GitRepository(context);
      const result = await repository.get_tags_pointing_to_commit(commit_id);

      expect(result).toEqual(tags);
    });
  });

  describe('commit', () => {
    it('should create a commit', async () => {
      const commit_id = 'bf8ea1c74183b3f07e5524eb27cb56c2d885c879';
      const context = new TestContext();
      context.execute.mockImplementation((command, input) => {
        if(command.startsWith('git add')) {
          return Promise.resolve({exit_code: 0, output: '', error: ''});
        } else if(command === 'git commit -F -') {
          return Promise.resolve({exit_code: 0, output: '', error: ''});
        } else if(command === 'git rev-parse HEAD') {
          return Promise.resolve({exit_code: 0, output: commit_id, error: ''});
        }
      });

      const repository = new GitRepository(context);
      const result = await repository.commit('this is my commit message', ['some.file'], []);

      expect(result).toEqual(commit_id);
    });
  });

  describe('push', () => {
    it('should execute git push', async () => {
      let result = false;

      const context = new TestContext();
      context.execute.mockImplementation((command, input) => {
        if(command.startsWith('git push')) {
          result = true;
        }

        return Promise.resolve({exit_code: 0, output: '', error: ''});
      });

      const repository = new GitRepository(context);
      await repository.push();

      expect(result).toBe(true);
    });
  });
});
