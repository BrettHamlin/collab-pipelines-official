/**
 * tests/validate-registry.test.ts
 *
 * Validates the integrity of the collab-pipelines-official registry:
 * - registry.json is valid JSON and has required fields
 * - All pipeline/pack directories have valid pipeline.json manifests
 * - All declared command files exist on disk
 * - No orphan directories (not in registry)
 * - No ghost registry entries (in registry but no directory)
 * - Pipeline names are unique
 * - Pack names are unique
 * - Schema compliance (structural checks)
 */

import { describe, test, expect } from "bun:test";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(import.meta.dir, "..");

function readJson(filePath: string): any {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// -- Registry -----------------------------------------------------------------

describe("registry.json", () => {
  let registry: any;

  test("1. registry.json is valid JSON", () => {
    const registryPath = path.join(ROOT, "registry.json");
    expect(fs.existsSync(registryPath)).toBe(true);
    registry = readJson(registryPath);
  });

  test("2. registry.json has required top-level fields", () => {
    const registry = readJson(path.join(ROOT, "registry.json"));
    expect(typeof registry.version).toBe("string");
    expect(typeof registry.updated).toBe("string");
    expect(Array.isArray(registry.packs)).toBe(true);
    expect(Array.isArray(registry.pipelines)).toBe(true);
  });

  test("3. all pipeline registry entries have required fields", () => {
    const registry = readJson(path.join(ROOT, "registry.json"));
    for (const entry of registry.pipelines) {
      expect(typeof entry.name, `pipeline ${entry.name}: missing name`).toBe("string");
      expect(typeof entry.version, `pipeline ${entry.name}: missing version`).toBe("string");
      expect(typeof entry.sha256, `pipeline ${entry.name}: missing sha256`).toBe("string");
      expect(typeof entry.description, `pipeline ${entry.name}: missing description`).toBe("string");
    }
  });

  test("4. all pack registry entries have required fields", () => {
    const registry = readJson(path.join(ROOT, "registry.json"));
    for (const entry of registry.packs) {
      expect(typeof entry.name, `pack ${entry.name}: missing name`).toBe("string");
      expect(typeof entry.version, `pack ${entry.name}: missing version`).toBe("string");
      expect(typeof entry.sha256, `pack ${entry.name}: missing sha256`).toBe("string");
      expect(typeof entry.description, `pack ${entry.name}: missing description`).toBe("string");
    }
  });

  test("5. pipeline names are unique in registry", () => {
    const registry = readJson(path.join(ROOT, "registry.json"));
    const names = registry.pipelines.map((p: any) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test("6. pack names are unique in registry", () => {
    const registry = readJson(path.join(ROOT, "registry.json"));
    const names = registry.packs.map((p: any) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// -- Pipeline manifests -------------------------------------------------------

describe("pipeline manifests", () => {
  const pipelinesDir = path.join(ROOT, "pipelines");
  const pipelineDirs = fs.readdirSync(pipelinesDir).filter((d) =>
    fs.statSync(path.join(pipelinesDir, d)).isDirectory()
  );

  test("7. every pipeline directory has a pipeline.json", () => {
    for (const dir of pipelineDirs) {
      const manifestPath = path.join(pipelinesDir, dir, "pipeline.json");
      expect(fs.existsSync(manifestPath), `Missing: pipelines/${dir}/pipeline.json`).toBe(true);
    }
  });

  test("8. all pipeline.json files are valid JSON", () => {
    for (const dir of pipelineDirs) {
      const manifestPath = path.join(pipelinesDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      expect(() => readJson(manifestPath), `Invalid JSON: pipelines/${dir}/pipeline.json`).not.toThrow();
    }
  });

  test("9. all pipeline manifests have required fields", () => {
    for (const dir of pipelineDirs) {
      const manifestPath = path.join(pipelinesDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      expect(typeof manifest.name, `${dir}: missing name`).toBe("string");
      expect(typeof manifest.version, `${dir}: missing version`).toBe("string");
      expect(manifest.type, `${dir}: type must be 'pipeline'`).toBe("pipeline");
      expect(typeof manifest.description, `${dir}: missing description`).toBe("string");
      expect(Array.isArray(manifest.commands), `${dir}: commands must be array`).toBe(true);
      expect(typeof manifest.clis, `${dir}: clis must be object`).toBe("object");
    }
  });

  test("10. all declared command files exist on disk", () => {
    for (const dir of pipelineDirs) {
      const manifestPath = path.join(pipelinesDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      for (const cmd of manifest.commands ?? []) {
        const cmdPath = path.join(pipelinesDir, dir, "commands", cmd);
        expect(fs.existsSync(cmdPath), `MISSING: pipelines/${dir}/commands/${cmd}`).toBe(true);
      }
    }
  });

  test("11. pipeline manifest name matches directory name", () => {
    for (const dir of pipelineDirs) {
      const manifestPath = path.join(pipelinesDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      expect(manifest.name, `${dir}: manifest name '${manifest.name}' does not match directory`).toBe(dir);
    }
  });
});

// -- Pack manifests -----------------------------------------------------------

describe("pack manifests", () => {
  const packsDir = path.join(ROOT, "packs");
  const packDirs = fs.readdirSync(packsDir).filter((d) =>
    fs.statSync(path.join(packsDir, d)).isDirectory()
  );

  test("12. every pack directory has a pipeline.json", () => {
    for (const dir of packDirs) {
      const manifestPath = path.join(packsDir, dir, "pipeline.json");
      expect(fs.existsSync(manifestPath), `Missing: packs/${dir}/pipeline.json`).toBe(true);
    }
  });

  test("13. all pack manifests have required fields", () => {
    for (const dir of packDirs) {
      const manifestPath = path.join(packsDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      expect(typeof manifest.name, `${dir}: missing name`).toBe("string");
      expect(manifest.type, `${dir}: type must be 'pack'`).toBe("pack");
      expect(Array.isArray(manifest.pipelines), `${dir}: pipelines must be array`).toBe(true);
    }
  });

  test("14. all pack pipeline references exist in pipelines/", () => {
    const pipelinesDir = path.join(ROOT, "pipelines");
    for (const dir of packDirs) {
      const manifestPath = path.join(packsDir, dir, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      for (const dep of manifest.pipelines ?? []) {
        const depDir = path.join(pipelinesDir, dep);
        expect(fs.existsSync(depDir), `Pack ${dir} references missing pipeline: ${dep}`).toBe(true);
      }
    }
  });
});

// -- Registry <-> filesystem consistency --------------------------------------

describe("registry <-> filesystem consistency", () => {
  const registry = readJson(path.join(ROOT, "registry.json"));

  test("15. no ghost pipeline registry entries (in registry but no directory)", () => {
    for (const entry of registry.pipelines) {
      const dir = path.join(ROOT, "pipelines", entry.name);
      expect(fs.existsSync(dir), `Ghost entry: pipelines/${entry.name} in registry but no directory`).toBe(true);
    }
  });

  test("16. no orphan pipeline directories (directory exists but not in registry)", () => {
    const pipelinesDir = path.join(ROOT, "pipelines");
    const dirs = fs.readdirSync(pipelinesDir).filter((d) =>
      fs.statSync(path.join(pipelinesDir, d)).isDirectory()
    );
    const registeredNames = new Set(registry.pipelines.map((p: any) => p.name));
    for (const dir of dirs) {
      expect(registeredNames.has(dir), `Orphan directory: pipelines/${dir} not in registry`).toBe(true);
    }
  });

  test("17. no ghost pack registry entries (in registry but no directory)", () => {
    for (const entry of registry.packs) {
      const dir = path.join(ROOT, "packs", entry.name);
      expect(fs.existsSync(dir), `Ghost entry: packs/${entry.name} in registry but no directory`).toBe(true);
    }
  });

  test("18. no orphan pack directories (directory exists but not in registry)", () => {
    const packsDir = path.join(ROOT, "packs");
    const dirs = fs.readdirSync(packsDir).filter((d) =>
      fs.statSync(path.join(packsDir, d)).isDirectory()
    );
    const registeredNames = new Set(registry.packs.map((p: any) => p.name));
    for (const dir of dirs) {
      expect(registeredNames.has(dir), `Orphan directory: packs/${dir} not in registry`).toBe(true);
    }
  });

  test("19. registry pipeline versions match manifest versions", () => {
    for (const entry of registry.pipelines) {
      const manifestPath = path.join(ROOT, "pipelines", entry.name, "pipeline.json");
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      expect(manifest.version, `${entry.name}: registry version '${entry.version}' != manifest version '${manifest.version}'`).toBe(entry.version);
    }
  });
});
