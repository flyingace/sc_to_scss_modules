const { toCamelCase } = require('./utilities');

function generateCamelCaseClassName(match, p1) {
  return `.${toCamelCase(p1)} {`;
}

function convertSCToSCSSModule(passedStyledComponent) {
  const fromClassName = /export const (\w+)( = styled\.[a-z0-9]+`)/g;
  const fromOldMedia = /(\${media\.)(\w+)`/g;
  const toNewMedia = '@include breakpoints.$2 {';
  const fromOldCloser = /`(})/g;
  const toNewCloser = '$1';

  return passedStyledComponent
    .replaceAll(fromClassName, generateCamelCaseClassName)
    .replace(fromOldMedia, toNewMedia)
    .replace(fromOldCloser, toNewCloser)
    .replaceAll('`;', '}');
}

module.exports = {
  convertSCToSCSSModule,
};
