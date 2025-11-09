import fs from "fs/promises";
import path from "path";

/**
 * Saves a GPX string to data/gpx/<userId>/<activityId>.gpx
 * Creates intermediate folders if missing.
 */
export async function saveGpxFile(userId: string, activityId: number, gpxContents: string) {
  const baseDir = path.join(process.cwd(), "data", "gpx", userId);
  await fs.mkdir(baseDir, { recursive: true });
  const filePath = path.join(baseDir, `${activityId}.gpx`);
  await fs.writeFile(filePath, gpxContents, "utf8");
  return filePath;
}

/**
 * Reads a GPX file back from disk.
 */
export async function readGpxFile(userId: string, activityId: number) {
  const filePath = path.join(process.cwd(), "data", "gpx", userId, `${activityId}.gpx`);
  return await fs.readFile(filePath, "utf8");
}
