jest.mock('fs');

const fs = require('fs');
const npm = require('./npm');

describe('project_types/npm', function() {

  it('should have a project name', function() {
    expect(npm.name).toBeDefined();
  });

  it('should be enabled if a package.json file exists in the project root', async function() {
    fs.access.mockImplementation(function(path, mode, cb) {
      cb = cb || mode;
      cb(undefined);
    });

    const result = await npm.is_enabled('some_npm_project_path');
    expect(result).toBe(true);
  });
  
  it('should be disabled if no package.json file is found in the project root', async function() {
    fs.access.mockImplementation(function(path, mode, cb) {
      cb = cb || mode;
      cb(new Error('file not found'));
    });

    const result = await npm.is_enabled('some_no_npm_project_path');
    expect(result).toBe(false);
  });

  it('should update the package.json file with the next version', async function() {
    const original_content = `{
  "name": "my-super-project",
  "version": "0.0.0"
}`;
    const expected_content = `{
  "name": "my-super-project",
  "version": "1.0.0"
}`;
    let saved_content = '';

    fs.readFile.mockImplementation(function(path, options, cb) {
      cb(null, original_content);
    });

    fs.writeFile.mockImplementation(function(path, content, options, cb) {
      saved_content = content;
      cb(null);
    });

    npm.update_version('some_project_path', '1.0.0')

    expect(saved_content).toEqual(expected_content);
  });

});
