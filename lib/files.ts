import fs from "fs/promises";
import path from "path";

/**
 * Saves a GPX string to data/gpx/<userId>/<activityId>.gpx
 * Creates intermediate folders if missing.
 */
export async function saveGpxFile(userId: string, activityId: number, gpxContents: string) {
  const relPath = path.join("data", "gpx", userId, `${activityId}.gpx`);
  const absPath = path.join(process.cwd(), relPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, gpxContents);
  return relPath; // store this one in DB
}

/**
 * Reads a GPX file back from disk.
 */
export async function readGpxFile(userId: string, activityId: number) {
  const filePath = path.join(process.cwd(), "data", "gpx", userId, `${activityId}.gpx`);
  return await fs.readFile(filePath, "utf8");
}
