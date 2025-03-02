const fs = require('fs');

const {
  createScssModuleFileFromStyledComponentFile,
} = require('./scssModuleFileFromStyledComponentFile');
const { processScssModules } = require('./replacePatternInFile');
const {
  convertStyledComponentsToHTMLElements,
} = require('./styledComponentsToHTMLElements');

// Get directory path from command line arguments
const directoryPath = process.argv[2];

if (!directoryPath) {
  console.error('Please provide a directory path as an argument');
  process.exit(1);
}

// Verify the directory exists
if (!fs.existsSync(directoryPath)) {
  console.error(`Directory ${directoryPath} does not exist`);
  process.exit(1);
}

async function runConversions(directory) {
  await createScssModuleFileFromStyledComponentFile(directory);
  await processScssModules(directory);
  await convertStyledComponentsToHTMLElements(directory);
}

runConversions(directoryPath);

/**
 * To run, in a terminal window type
 * node convert.js [path/to/target/directory]
 */
