const required = { major: 20, minor: 19, patch: 0 };

function parseVersion(version) {
  const [major, minor, patch] = version.replace(/^v/, '').split('.').map(Number);
  return { major, minor, patch };
}

function isAtLeast(current, min) {
  if (current.major !== min.major) return current.major > min.major;
  if (current.minor !== min.minor) return current.minor > min.minor;
  return current.patch >= min.patch;
}

const current = parseVersion(process.version);
if (!isAtLeast(current, required)) {
  console.error(
    `Node.js ${required.major}.${required.minor}.${required.patch}+ is required. ` +
      `Current: ${process.version}`
  );
  process.exit(1);
}

console.log(`Node.js version OK: ${process.version}`);
