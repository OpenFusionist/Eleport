import path from "path";
import { GetGameDownloadDir } from "./utils";
import fs from 'fs';

export function getLOCAL_Version(): string {
  const local_version_file = path.join(GetGameDownloadDir(), 'version');
  if (fs.existsSync(local_version_file)) {
    return fs.readFileSync(local_version_file, 'utf8')
  }
  
  return ""
}
