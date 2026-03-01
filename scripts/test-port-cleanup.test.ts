import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";

const repoRoot = import.meta.dir.replace(/\/scripts$/, "");

describe("test port cleanup wiring", () => {
  it("runs dedicated cleanup before backend integration and web e2e", () => {
    const packageJson = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["kill-test-ports"]).toBe(
      "bash scripts/kill-test-ports.sh",
    );
    expect(packageJson.scripts["test:backend"]).toStartWith(
      "bun run kill-test-ports && ",
    );
    expect(packageJson.scripts["e2e:web"]).toStartWith(
      "bun run kill-test-ports && ",
    );
  });

  it("cleans the standard and e2e emulator ports", () => {
    const script = readFileSync(
      join(repoRoot, "scripts/kill-test-ports.sh"),
      "utf8",
    );

    for (const port of ["9099", "8080", "5001", "9199", "8180", "5011", "8099"]) {
      expect(script).toContain(port);
    }
  });
});
