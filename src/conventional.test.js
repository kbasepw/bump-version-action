const conventional = require('./conventional');

const commits = {
  fix: '[#1234] fix: my commit message',
  doc: 'doc: my commit message',
  test: 'test: my commit message',
  feat: 'feat: my commit message',
  feature: 'feature: my commit message',
  scoped_feature: 'feature(with_scope): my commit message',
  breaking_change: 'BREAKING CHANGE: my commit message',
  breaking_change_footer: 'feat: my commit message\n\nBREAKING-CHANGE: this break something',
};

Object.keys(commits)
  .forEach(key => {
    commits[key] = [
        'commit 6225ee66f34170860f33ce53950f24b46da289ff',
        'Author: test scenario <scenario@test.com>',
        'Date:   ' + (new Date()).toString(),
        '',
        commits[key].split('\n').map(line => '    ' + line).join('\n'),
        '',
    ].join('\n');
  });

describe('conventional', function() {

  describe('parse_commit', function() {
    it.each([
      ['fix', { type: 'fix', badges: ['#1234'] }],
      ['doc', { type: 'doc' }],
      ['test', { type: 'test' }],
      ['feat', { type: 'feat' }],
      ['feature', { type: 'feature' }],
      ['scoped_feature', { type: 'feature', scope: 'with_scope' }],
      ['breaking_change', { type: 'breaking-change' }],
      ['breaking_change_footer', { type: 'breaking-change' }],
    ])('should match expected for commit %s', function(commit, expected) {
      const result = conventional.parse_commit(commits[commit]);
      expect(result).toMatchObject(expected);
    });
  });

  describe('get_commit_category', function() {

    it.each([
      [conventional.types.NONE, commits.doc],
      [conventional.types.NONE, commits.test],
      [conventional.types.PATCH, commits.fix],
      [conventional.types.MINOR, commits.feat],
      [conventional.types.MINOR, commits.feature],
      [conventional.types.MINOR, commits.scoped_feature],
      [conventional.types.MAJOR, commits.breaking_change],
      [conventional.types.MAJOR, commits.breaking_change_footer],
    ])('should return %s for commit body "%s"', function(expected, commit) {
      const result = conventional.get_commit_category(commit);
      expect(result).toEqual(expected);
    });

  });

  describe('get_next_version', function() {

    it.each([
      ['0.0.1', null, [commits.fix]],
      ['1.0.1', '1.0.0', [commits.fix]],
      ['0.0.2', '0.0.1', [commits.fix, commits.doc, commits.test]],
      ['0.1.0', null, [commits.feat]],
      ['0.1.0', '0.0.1', [commits.fix, commits.feat, commits.feature, commits.doc]],
      ['1.0.0', null, [commits.breaking_change, commits.feat, commits.fix]],
      ['2.0.0', '1.13.44', Object.keys(commits).map(k => commits[k])],
    ])('should return bump to %s from %s', function(expected, start, commits) {
      const result = conventional.get_next_version(start, commits);
      expect(result).toEqual(expected);
    });

  });

});

