const fs = require('fs').promises;
const path = require('path');
const { addBreakpointsImport } = require('./addUseStatementToSCSSFiles');
const { convertSCToSCSSModule } = require('./styledComponentToScssModule');
const { styledComponentRegex } = require('./utilities');

async function findScssModules(directory) {
  const files = await fs.readdir(directory);
  let scssModules = [];

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      const subDirFiles = await findScssModules(filePath);
      scssModules = scssModules.concat(subDirFiles);
    } else if (file.endsWith('.module.scss')) {
      scssModules.push(filePath);
    }
  }

  return scssModules;
}

async function processScssModules(directory) {
  try {
    // Find all .module.scss files in directory and subdirectories
    const scssModules = await findScssModules(directory);

    console.log(`Found ${scssModules.length} SCSS modules to process`);

    for (const filePath of scssModules) {
      // Read file content
      let content = await fs.readFile(filePath, 'utf8');

      // First, handle the @use statement
      content = addBreakpointsImport(filePath, directory, content);

      // Then process the pattern matches
      let matches = [...content.matchAll(styledComponentRegex)];

      if (matches.length > 0) {
        let newContent = matches
          .map((match) => convertSCToSCSSModule(match[0]))
          .join('\n\n');

        // Preserve the @use statement when updating content
        const useStatement = content.split('\n')[0];
        newContent = `${useStatement}\n\n${newContent}`;

        await fs.writeFile(filePath, newContent, 'utf8');
        console.log(
          `Processed matches in: ${path.relative(directory, filePath)}`
        );
        console.log(`Found and processed ${matches.length} matches`);
      } else {
        // If there were no matches but we added an import, still write the file
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Added import to: ${path.relative(directory, filePath)}`);
      }
    }

    console.log('All SCSS modules processed successfully');
  } catch (error) {
    console.error('Error processing SCSS modules:', error);
    throw error;
  }
}

module.exports = { processScssModules };
