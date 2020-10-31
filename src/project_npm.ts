import Context from './context';
import ProjectType from './project';
import VersionInfo from './version_info';

export default class NpmProjectType extends ProjectType {

  public constructor(context: Context) {
    super(context);
  }

  public is_enabled(): Promise<boolean> {
    return this.context.exists_file('package.json');
  }

  public async update_version(version_info: VersionInfo): Promise<string[]> {
    const result = await this.context.execute(`npm version ${version_info.version} --no-git-tag-version -f`);

    if (result.exit_code === 0) {
      return ['package.json'];
    } else {
      return [];
    }
  }
}
