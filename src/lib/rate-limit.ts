import { createHash } from "node:crypto";
const buckets = new Map<string, { count: number; expires: number }>();
export function allowRequest(identity: string, now = Date.now()) {
  for (const [key, bucket] of buckets)
    if (bucket.expires <= now) buckets.delete(key);
  const key = createHash("sha256").update(identity).digest("hex");
  const bucket = buckets.get(key);
  if (bucket && bucket.count >= 5) return false;
  if (bucket) bucket.count++;
  else {
    if (buckets.size >= 10000) return false;
    buckets.set(key, { count: 1, expires: now + 600000 });
  }
  return true;
}
