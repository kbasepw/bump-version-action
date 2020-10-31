import ScenarioContext from './__fixtures/scenario_builder';
import VersionManager from './version_manager';

describe('VersionManager', () => {
  it('should bump to version 0.1.0 a new project with a feature commit', async () => {
    const context = new ScenarioContext();
    await context.create_npm_project([
      'feat: some new interesting feature'
    ]);
    
    const manager = new VersionManager(context);
    const result = await manager.bump_version();

    expect(result).toHaveProperty('current_version', '0.0.0');
    expect(result).toHaveProperty('version', '0.1.0');
    expect(result).toHaveProperty('subject', 'release: new version 0.1.0 [skip ci]');
    expect(result).toHaveProperty('changelog', expect.any(String));
    expect(result.changelog.length).not.toBe(0);
  });

  it('should respect last commit version tag', async function() {
    const context = new ScenarioContext();
    await context.create_npm_project([
      {
        message: '[release] a version tagged commit',
        tags: ['v1.0.0']
      }
    ]);
    
    const manager = new VersionManager(context);
    const result = await manager.bump_version();

    expect(result).toHaveProperty('version', '1.0.0');
  });

  it('should bump version if last commit tags are not version tags', async function() {
    const context = new ScenarioContext();
    await context.create_npm_project([
      {
        message: 'feat: some new feature'
      },
      {
        message: 'fix: some error fix'
      },
      {
        message: '[release] a version tagged commit',
        tags: ['some_other_tag']
      }
    ]);

    const manager = new VersionManager(context);
    const result = await manager.bump_version();

    expect(result).toHaveProperty('version', '0.1.0');
  });
});

