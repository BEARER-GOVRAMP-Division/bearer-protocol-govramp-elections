import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();

const requiredFiles = [
  "BEARER_Protocol_Application.html",
  "Repository_README.md",
  "CONSOLIDATION.md",
  "ISO_Statement_of_Applicability.md",
  "GovRAMP_Fast-Track_Proposal.md",
  "src/app.js",
  "src/demoState.js",
  "tests/demoState.test.js",
  "tests/repositoryMetadata.test.js"
];

async function assertFileExists(relativePath) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  await access(absolutePath, constants.R_OK);
}

async function main() {
  await Promise.all(requiredFiles.map(assertFileExists));

  const html = await readFile(path.join(repositoryRoot, "BEARER_Protocol_Application.html"), "utf8");
  const repoReadme = await readFile(path.join(repositoryRoot, "Repository_README.md"), "utf8");
  const proposal = await readFile(path.join(repositoryRoot, "GovRAMP_Fast-Track_Proposal.md"), "utf8");
  const consolidation = await readFile(path.join(repositoryRoot, "CONSOLIDATION.md"), "utf8");

  const expectations = [
    [html, /BEARER Protocol Elections Unified Edition/i, "HTML should use the unified edition branding."],
    [html, /Conceptual demo only/i, "HTML should clearly identify the app as a conceptual demo."],
    [html, /does not collect real votes/i, "HTML should disclaim real vote processing."],
    [html, /Assured Workloads/i, "HTML should disclaim unsupported Assured Workloads integration claims."],
    [html, /type="module" src="\.\/src\/app\.js"/i, "HTML should load the browser application module."],
    [repoReadme, /not.*real voting system/i, "Repository guide should disclaim real-world use."],
    [repoReadme, /Assured Workloads integration or synchronization/i, "Repository guide should disclaim Assured Workloads synchronization."],
    [repoReadme, /Roadmap before any real-world use/i, "Repository guide should include a roadmap section."],
    [proposal, /does \*\*not\*\* claim to be GovRAMP authorized/i, "Proposal should reject unsupported authorization claims."],
    [consolidation, /bearer-protocol-govramp/i, "Consolidation record should identify the reviewed source repository."],
    [consolidation, /does \*\*not\*\* implement Google Cloud Assured Workloads integration or synchronization/i, "Consolidation record should document the absence of Assured Workloads integration."]
  ];

  for (const [source, pattern, message] of expectations) {
    if (!pattern.test(source)) {
      throw new Error(message);
    }
  }

  console.log("Validation passed: key files, unified branding, and disclaimer text are present.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
