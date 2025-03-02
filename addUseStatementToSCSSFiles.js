const path = require('path');

function getRelativeImportPath(filePath) {
  const currentDir = path.dirname(filePath);
  const pathNodeArray = currentDir.split('/');
  const pathNodeArrayLength = pathNodeArray.length;
  const indexOfSrcDirectory = pathNodeArray.indexOf('src');
  const parentCount = pathNodeArrayLength - indexOfSrcDirectory - 1;
  const pathToBreakpointsArray = new Array(parentCount).fill('../');
  pathToBreakpointsArray.splice(
    parentCount,
    0,
    'lib/styles/mixins/breakpoints'
  );
  const pathToBreakpoints = pathToBreakpointsArray.join('');

  return `@use '${pathToBreakpoints}';`;
}

function checkForExistingImport(content, importStatement) {
  // Check for the import with potential variations in quotes and whitespace
  const importPattern = new RegExp(
    importStatement
      .replace(/['"]/g, '[\'"]') // Match either single or double quotes
      .replace(/\s+/g, '\\s+') // Match varying whitespace
      .replace(/\//g, '[\\/]') // Match either forward or backslashes
  );

  return importPattern.test(content);
}

function addBreakpointsImport(filePath, rootDir, content) {
  const importStatement = getRelativeImportPath(filePath);

  // Check if import already exists
  if (checkForExistingImport(content, importStatement)) {
    return content;
  }

  // Add import at the beginning of the file with a newline after
  return `${importStatement}\n\n${content}`;
}

module.exports = {
  addBreakpointsImport,
};
