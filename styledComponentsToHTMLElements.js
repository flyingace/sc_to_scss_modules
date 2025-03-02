const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const { styledComponentRegex, toCamelCase } = require('./utilities');

// Recursively find files with a specific extension
async function findFiles(dir, extension) {
  let results = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      const subResults = await findFiles(fullPath, extension);
      results = results.concat(subResults);
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

// Find all styled component definitions in a file
async function findStyledComponents(fileContent) {
  const components = [];
  let match;

  while ((match = styledComponentRegex.exec(fileContent)) !== null) {
    components.push({
      fullMatch: match[0],
      styleName: match[1],
      htmlElement: match[2],
    });
  }

  return components;
}

// Find files importing the styles file
async function findImportingFiles(stylesFilePath) {
  const baseDir = path.dirname(stylesFilePath);
  const importingFiles = [];

  // Find all TSX and JSX files
  const tsxFiles = await findFiles(baseDir, '.tsx');
  const jsxFiles = await findFiles(baseDir, '.jsx');
  const allFiles = [...tsxFiles, ...jsxFiles];

  for (const file of allFiles) {
    const content = await readFileAsync(file, 'utf8');
    const relativePath = path
      .relative(path.dirname(file), stylesFilePath)
      .replace(/\\/g, '/') // Convert Windows paths
      .replace('.ts', '');

    if (
      content.includes(`from './${relativePath}'`) ||
      content.includes(`from "${relativePath}"`)
    ) {
      importingFiles.push(file);
    }
  }

  return importingFiles;
}

// Process a single file that uses styled components
async function processFile(file, styledComponents) {
  let content = await readFileAsync(file, 'utf8');
  const originalContent = content;

  // In each file replace styled-component tags with HTML elements and `className` attributes
  for (const { styleName, htmlElement } of styledComponents) {
    // matches Styled-Component opening tags
    const tagOpeningRegex = new RegExp(`<S\\.${styleName}\\b([^>]*)`, 'g');
    // matches Styled-Component closing tags
    const tagClosingRegex = new RegExp(`<\/S\\.${styleName}>`, 'g');
    const camelCaseStyle = toCamelCase(styleName);
    // Replaces the opening tag with an HTML element and inserts `className={styles.[camelCaseStyle]}`
    content = content.replace(tagOpeningRegex, (match, attributes) => {
      return `<${htmlElement} className={styles.${camelCaseStyle}}${attributes}`;
    });
    // Replaces the closing tag with an HTML element
    content = content.replace(tagClosingRegex, (match, attributes) => {
      return `</${htmlElement}>`;
    });
  }

  // Add CSS modules import if needed and content changed
  if (content !== originalContent) {
    const cssModulesImport = `import styles from './${path.basename(file, path.extname(file))}.module.scss';`;
    if (!content.includes(cssModulesImport)) {
      content = cssModulesImport + '\n' + content;
    }
  }

  await writeFileAsync(file, content, 'utf8');
}

// Main function to process all styled component files
async function convertStyledComponentsToHTMLElements(baseDir) {
  try {
    // Find all .styles.ts files
    const styleFiles = await findFiles(baseDir, '.styles.ts');

    for (const styleFile of styleFiles) {
      const content = await readFileAsync(styleFile, 'utf8');
      const styledComponents = await findStyledComponents(content);
      // console.log(styledComponents[0]);

      if (styledComponents.length === 0) continue;

      // Find files that import this styles file
      const importingFiles = await findImportingFiles(styleFile);

      // Process each importing file
      for (const file of importingFiles) {
        await processFile(file, styledComponents);
      }

      // Remove styled component definitions from the styles file
      let newContent = content;
      for (const { fullMatch } of styledComponents) {
        newContent = newContent.replace(fullMatch, '');
      }
      await writeFileAsync(styleFile, newContent, 'utf8');

      console.log(
        `Processed ${styleFile} and ${importingFiles.length} dependent files`
      );
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

module.exports = { convertStyledComponentsToHTMLElements };
