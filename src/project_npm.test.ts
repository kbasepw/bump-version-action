import NpmProjectType from './project_npm';
import ScenarioContext from './__fixtures/scenario_builder';
import TestContext from './__fixtures/context';

describe('NpmProjectType', () => {
  describe('is_enabled', () => {
    it('should return true if there is a project.json file', async () => {
      const context = new TestContext();
      context.exists_file.mockImplementation((relative_path) => {
        return relative_path === 'package.json';
      });

      const project = new NpmProjectType(context);
      const result = await project.is_enabled();

      expect(result).toBe(true);
    });

    it('should return false if there is no project.json file', async () => {
      const context = new TestContext();
      context.exists_file.mockResolvedValue(false);

      const project = new NpmProjectType(context);
      const result = await project.is_enabled();

      expect(result).toBe(false);
    });
  });

  describe('update_version', () => {
    it('should update package.json with the new version', async () => {
      const version_info = {
        current_version: '1.0.0',
        version: '1.1.0',
        commit_id: '123456',
        subject: 'some message',
        changelog: ''
      };

      const context = new ScenarioContext();
      await context.create_npm_project(null);

      const project = new NpmProjectType(context);
      const result = await project.update_version(version_info);

      const pkg = JSON.parse(await context.get_file_content_or_empty('package.json'));
      expect(pkg.version).toEqual(version_info.version);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual('package.json');
    });
  });
});
