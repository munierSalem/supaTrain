import fs from "fs/promises";
import path from "path";

/**
 * Saves an activity's "stream" file to data/streams/<userId>/<activityId>.json
 * Creates intermediate folders if missing.
 */
export async function saveStreamFile(userId: string, activityId: number, gpxContents: string) {
  const relPath = path.join("data", "streams", userId, `${activityId}.json`);
  const absPath = path.join(process.cwd(), relPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, gpxContents);
  return relPath; // store this one in DB
}

/**
 * Reads an activity's "stream" file back from disk.
 */
export async function readStreamFile(userId: string, activityId: number) {
  const filePath = path.join(process.cwd(), "data", "streams", userId, `${activityId}.json`);
  return await fs.readFile(filePath, "utf8");
}
