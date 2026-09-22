import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();

const requiredFiles = [
  "BEARER_Protocol_Application.html",
  "Repository_README.md",
  "ISO_Statement_of_Applicability.md",
  "GovRAMP_Fast-Track_Proposal.md",
  "src/app.js",
  "src/demoState.js",
  "tests/demoState.test.js"
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

  const expectations = [
    [/Conceptual demo only/i, "HTML should clearly identify the app as a conceptual demo."],
    [/does not collect real votes/i, "HTML should disclaim real vote processing."],
    [/type="module" src="\.\/src\/app\.js"/i, "HTML should load the browser application module."],
    [/not a real voting system/i, "Repository guide should disclaim real-world use."],
    [/Roadmap before any real-world use/i, "Repository guide should include a roadmap section."],
    [/does \*\*not\*\* claim to be GovRAMP authorized/i, "Proposal should reject unsupported authorization claims."]
  ];

  for (const [pattern, message] of expectations) {
    const source = message.startsWith("Proposal") ? proposal : message.startsWith("Repository") ? repoReadme : html;
    if (!pattern.test(source)) {
      throw new Error(message);
    }
  }

  console.log("Validation passed: key files and disclaimer text are present.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
