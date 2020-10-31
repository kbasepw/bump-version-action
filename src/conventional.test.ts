import TestContext from './__fixtures/context';
import ConventionalSchema, {ConventionalCommit, VersionLevel} from './conventional';

const commits = {
  fix: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: '[#1234] fix: my commit message',
    body: '',
  },
  doc: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'doc: my commit message',
    body: '',
  },
  test: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'test: my commit message',
    body: '',
  },
  feat: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'feat: my commit message',
    body: '',
  },
  feature: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'feature: my commit message',
    body: '',
  },
  scoped_feature: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'feature(with_scope): my commit message',
    body: '',
  },
  breaking_change: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'BREAKING CHANGE: my commit message',
    body: '',
  },
  breaking_change_footer: {
    hash: '6225ee66f34170860f33ce53950f24b46da289ff',
    headers: new Map(Object.entries({
      Author: 'test scenario <scenario@test.com>',
      Date: (new Date()).toString(),
    })),
    subject: 'feat: my commit message',
    body: '\nBREAKING-CHANGE: this breaks something',
  },
};

describe('ConventionalSchema', () => {

  describe('constructor', () => {
    it.each([
      ['fix', { type: 'fix', badges: ['#1234'], level: VersionLevel.PATCH }],
      ['doc', { type: 'doc', level: VersionLevel.NONE }],
      ['test', { type: 'test', level: VersionLevel.NONE }],
      ['feat', { type: 'feature', level: VersionLevel.MINOR }],
      ['feature', { type: 'feature', level: VersionLevel.MINOR }],
      ['scoped_feature', { type: 'feature', scope: 'with_scope', level: VersionLevel.MINOR }],
      ['breaking_change', { type: 'breaking-change', level: VersionLevel.MAJOR }],
      ['breaking_change_footer', { type: 'breaking-change', level: VersionLevel.MAJOR }],
    ] as any)('should match expected for commit %s', function(commit_name, expected) {
      const commit = commits[commit_name];
      const context = new TestContext();
      const schema = new ConventionalSchema(context, [commit]);
      expect(schema.commits[0]).toMatchObject({
        ...commit,
        subject: 'my commit message',
        ...expected,
      });
    });
  });

  describe('get_next_version', () => {
    it.each([
      ['0.0.1', null, [commits.fix]],
      ['1.0.1', '1.0.0', [commits.fix]],
      ['0.0.2', '0.0.1', [commits.fix, commits.doc, commits.test]],
      ['0.1.0', null, [commits.feat]],
      ['0.1.0', '0.0.1', [commits.fix, commits.feat, commits.feature, commits.doc]],
      ['1.0.0', null, [commits.breaking_change, commits.feat, commits.fix]],
      ['2.0.0', '1.13.44', Object.keys(commits).map(k => commits[k])],
    ] as any)('should return bump to %s from %s', function(expected, current_version, commits) {
      const context = new TestContext();
      const schema = new ConventionalSchema(context, commits);
      const result = schema.get_next_version(current_version);
      expect(result).toEqual(expected);
    });
  });

  describe('generate_changelog', () => {
    it('should organize commits in sections', async () => {
      const context = new TestContext();
      context.get_file_content_or_empty.mockResolvedValue('');

      const expected = `
Breaking Changes
----------------

* new configuration format ([commit](${context.project_url}/commit/2))

New features
------------

* some new feature ([commit](${context.project_url}/commit/3))

Bug fixes
---------

* [#1](${context.project_url}/issues/1) **module**: some bug fix ([commit](${context.project_url}/commit/1))
      `.trim();

      const schema = new ConventionalSchema(context, [
        {
          ...commits.fix,
          hash: '1',
          subject: '[#1] fix(module): some bug fix',
        },
        {
          ...commits.breaking_change,
          hash: '2',
          subject: 'BREAKING CHANGE: new configuration format',
        },
        {
          ...commits.feature,
          hash: '3',
          subject: 'feat: some new feature',
        },
      ]);
      const result = await schema.generate_changelog();
      expect(result).toEqual(expected);
    });

    it('should generate only sections with commits', async () => {
      const context = new TestContext();
      context.get_file_content_or_empty.mockResolvedValue('');

      const expected = `
Bug fixes
---------

* [#1](${context.project_url}/issues/1) **module**: some bug fix ([commit](${context.project_url}/commit/1))
      `.trim();

      const schema = new ConventionalSchema(context, [
        {
          ...commits.fix,
          hash: '1',
          subject: '[#1] fix(module): some bug fix',
        },
      ]);
      const result = await schema.generate_changelog();
      expect(result).toEqual(expected);
    });

    it('should prepend release notes', async () => {
      const release_notes = 'This are some release notes.';
      const context = new TestContext();
      context.get_file_content_or_empty.mockImplementation((relative_path) => {
        if (relative_path === 'RELEASE_NOTES.md') {
          return Promise.resolve(release_notes);
        }

        return Promise.resolve('');
      });

      const expected = `
${release_notes}

Bug fixes
---------

* [#1](${context.project_url}/issues/1) **module**: some bug fix ([commit](${context.project_url}/commit/1))
      `.trim();

      const schema = new ConventionalSchema(context, [
        {
          ...commits.fix,
          hash: '1',
          subject: '[#1] fix(module): some bug fix',
        },
      ]);
      const result = await schema.generate_changelog();
      expect(result).toEqual(expected);
    });

    it('should append known bugs at the end of the changelog', async () => {
      const known_bugs = `
Known bugs
----------

* In some component when something happen then the application crash.
      `.trim();
      const context = new TestContext();
      context.get_file_content_or_empty.mockImplementation((relative_path) => {
        if (relative_path === 'KNOWN_BUGS.md') {
          return Promise.resolve(known_bugs);
        }

        return Promise.resolve('');
      });

      const expected = `
Bug fixes
---------

* [#1](${context.project_url}/issues/1) **module**: some bug fix ([commit](${context.project_url}/commit/1))

${known_bugs}
      `.trim();

      const schema = new ConventionalSchema(context, [
        {
          ...commits.fix,
          hash: '1',
          subject: '[#1] fix(module): some bug fix',
        },
      ]);
      const result = await schema.generate_changelog();
      expect(result).toEqual(expected);
    });
  });
});

