// Backwards-compat shim. The real implementation lives in `apiClient.js`,
// which talks to the FastAPI backend over HTTP.
//
// All the old `import { db } from "@/api/base44Client"` statements keep
// working — `db.auth.me()`, `db.entities.Load.list()` etc. all match the
// shape expected by the rest of the app.

export { db as default, db } from "./apiClient";
