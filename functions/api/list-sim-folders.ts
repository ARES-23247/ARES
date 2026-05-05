export async function GET() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const simsDir = path.join(process.cwd(), "src", "sims");
  const registryPath = path.join(simsDir, "simRegistry.json");

  // Read existing registry to exclude registered sims
  let registeredPaths: string[] = [];
  try {
    const registryContent = fs.readFileSync(registryPath, "utf-8");
    const registry = JSON.parse(registryContent);
    registeredPaths = registry.simulators.map((s: { path: string }) => s.path.replace(/^\.\//, ""));
  } catch {
    // If registry doesn't exist or can't be parsed, continue with empty list
  }

  // Scan for folders
  const folders: string[] = [];
  try {
    const entries = fs.readdirSync(simsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderName = entry.name;
        // Check if it has an index.tsx
        const indexPath = path.join(simsDir, folderName, "index.tsx");
        if (fs.existsSync(indexPath) && !registeredPaths.includes(folderName)) {
          folders.push(folderName);
        }
      }
    }
  } catch (err) {
    console.error("Error scanning sims directory:", err);
  }

  return Response.json({
    folders: folders.sort(),
    registeredPaths,
  });
}
