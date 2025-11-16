#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

// Paths to scan
const WORKSPACES = ["apps", "packages"];

function findPackageJsonFiles(baseDir) {
  const results = [];

  for (const workspace of WORKSPACES) {
    const fullPath = path.join(baseDir, workspace);

    if (!fs.existsSync(fullPath)) continue;

    const items = fs.readdirSync(fullPath);
    for (const item of items) {
      const pkgPath = path.join(fullPath, item, "package.json");
      if (fs.existsSync(pkgPath)) results.push(pkgPath);
    }
  }

  return results;
}

function loadPackageJson(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    file,
    name: data.name,
    dependencies: data.dependencies || {},
    devDependencies: data.devDependencies || {},
  };
}

function analyzePackages(pkgs) {
  const depMap = {};

  for (const pkg of pkgs) {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const depName of Object.keys(allDeps)) {
      if (!depMap[depName]) depMap[depName] = [];
      depMap[depName].push(pkg.name);
    }
  }

  return depMap;
}

function printResults(depMap) {
  console.log("\n🔍 Shared Dependencies Report\n");

  let sharedCount = 0;

  for (const [dep, usedIn] of Object.entries(depMap)) {
    if (usedIn.length > 1) {
      sharedCount++;

      console.log(`📦 ${dep}`);
      console.log(`   → Used in: ${usedIn.join(", ")}`);

      if (usedIn.length >= 2) {
        console.log("   ✔ Suggestion: Move to root package.json\n");
      }
    }
  }

  if (sharedCount === 0) {
    console.log("No shared dependencies found 🎉");
  }
}

function main() {
  const root = process.cwd();

  const files = findPackageJsonFiles(root);
  const packages = files.map(loadPackageJson);
  const depMap = analyzePackages(packages);

  printResults(depMap);
}

main();
