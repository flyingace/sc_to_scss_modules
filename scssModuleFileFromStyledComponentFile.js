const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { fileExists } = require('./utilities');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

async function createScssModuleFileFromStyledComponentFile(startPath) {
  // Ensure the path exists
  if (!fs.existsSync(startPath)) {
    console.error('Directory not found:', startPath);
    return;
  }

  // Keep track of statistics
  const stats = {
    processed: 0,
    created: 0,
    skipped: 0,
  };

  async function processDirectory(currentPath) {
    const files = await readdir(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileStats = await stat(filePath);

      if (fileStats.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(filePath);
      } else if (file.endsWith('.styles.ts')) {
        stats.processed++;

        // Transform matching files
        const directory = path.dirname(filePath);
        const fileName = path.basename(file);

        // Create new filename:
        // Replace .styles.ts with .module.scss
        const newFileName = fileName
          .slice(0)
          .replace('.styles.ts', '.module.scss');

        const newFilePath = path.join(directory, newFileName);

        // Check if file already exists
        if (await fileExists(newFilePath)) {
          console.warn(`Skipped: ${newFilePath} (file already exists)`);
          stats.skipped++;
          continue;
        }

        // Copy and rename the file
        try {
          await copyFile(filePath, newFilePath);
          console.log(`Created: ${newFilePath} (copied from ${fileName})`);
          stats.created++;
        } catch (error) {
          console.error(`Error creating ${newFilePath}:`, error.message);
        }
      }
    }
  }

  try {
    console.log('Starting file transformation...');
    await processDirectory(startPath);
    console.log('\nTransformation complete!');
    console.log(`Files processed: ${stats.processed}`);
    console.log(`Files created: ${stats.created}`);
    console.log(`Files skipped: ${stats.skipped}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

module.exports = { createScssModuleFileFromStyledComponentFile };
