import fs from "node:fs";

export function getDatabaseSslConfig() {
  if (process.env.DB_SSL !== "true") {
    return false;
  }

  const caPath = process.env.DB_SSL_CA_PATH;
  return caPath ? { ca: fs.readFileSync(caPath, "utf8") } : true;
}