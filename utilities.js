const fs = require('fs');
const { promisify } = require('util');
const access = promisify(fs.access);

function toCamelCase(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

async function fileExists(filePath) {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Regex for finding styled-component definitions
const styledComponentRegex =
  /export const\s+([a-zA-Z0-9]+)\s*=\s*styled\.([a-z]+)`\n[^]*?`;\n/g;

module.exports = {
  fileExists,
  styledComponentRegex,
  toCamelCase,
};
