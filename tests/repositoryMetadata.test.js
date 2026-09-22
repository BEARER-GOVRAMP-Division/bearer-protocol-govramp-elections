import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("repository branding and consolidation docs describe the unified edition accurately", async () => {
  const [readme, consolidation, packageJson] = await Promise.all([
    read("README.md"),
    read("CONSOLIDATION.md"),
    read("package.json")
  ]);

  const pkg = JSON.parse(packageJson);

  assert.match(readme, /BEARER Protocol Elections Unified Edition/i);
  assert.match(readme, /does \*\*not\*\* represent .*Assured Workloads synchronization/i);
  assert.match(consolidation, /bearer-protocol-govramp-elections/i);
  assert.match(consolidation, /no tracked content on `main`/i);
  assert.equal(pkg.name, "bearer-protocol-elections-unified-edition");
  assert.match(pkg.description, /Unified Edition conceptual browser demo/i);
});
