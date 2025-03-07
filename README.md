# The Transformer!
This is still just several scripts that are being run in sequence by another script but it'll be easier to refer to it by name than by "the scripts," so hereafter I'm going to refer to it as **The Transformer**.

## Transforms Styled-Components and their use to SCSS-Modules and HTML elements!
The easiest way to run **The Transformer** is
1. Clone this repo
2. cd into the repo in the terminal and type
3. enter `node convert.js [path/to/target/directory]` where `directory` is the parent directory for all the files you wish to convert.

Conversions will occur to React `.tsx` files, Styled-Components `.styles.ts` files and a new `.module.scss` file will be created alongside every `.styles.ts` file.



## What does this all do? Can you explain it to me in way, way too much detail?
Have we met?   

**The Transformer** can be used to transform `styled-components` definitions into `scss-module` class definitions provided they don't use passed props or theme values. `styled-component` definitions with those properties are ignored by **The Transformer**.

Naturally, `styled-component` definitions are defined in separate files, each ending with `.styles.ts`. Once the definitions in those files have been converted **The Transformer** will locate any React `.tsx` files that have imported these `.styles.ts` files. Then the React `.tsx` files will be parsed and any instances of the `styled-component` definitions will be replaced by with the appropriate HTML element and a `className` attribute that uses the new SCSS class created previously.

**The Transformer**

1. Finds convertable `styled-component` definitions in `.styles.ts` files, and
1. converts them into valid CSS/SCSS code, and
1. writes that new code into an appropriately-named `.module.scss` file, and
1. deletes any such copied `styled-component` definitions from the original file, and
1. writes an import statement into the document where the `module.scss` styles are to be used, and
1. writes an `@use` statement into the top of the `module.scss` file so that it will have access to shared breakpoint definitions.

The instances of the `styled-components` that have been thus converted are then located in the React `.tsx` files and replaced with
the HTML element the `styled-components` definition had been modifying
and `className={styles.[className]}` is inserted into the tag where `className` is the previous name of the `styled-component` with the first letter switched to lowercase.

For example, let's suppose we're starting with two files: `MyPage.tsx` and `MyPage.styles.ts`.
```typescript
// MyPage.tsx
import * as S from './MyPage.styles';

export default function MyPage({title}: PropsWithChildren<{title: string}>) {
  <S.PageContainer id={`${title}-page-container'}>
    <S.PageTitle>{title}</S.PageTitle>
    {children}
  </S.PageContainer>
}
```
```typescript
// MyPage.styles.ts
import styled from 'styled-components/macro';
import { PageTitle } from 'components/PageTitle/PageTitle';
import { media } from 'lib/media-queries/mixins';

export const PageContainer = styled.div`
  width: 100%;
  min-height: 400px;
  background-color: green;

  ${media.TabletPortraitUp`
    min-height: 300px;
  `}
`;

export PageTitle = styled(PageTitle)`
  font-family: Arial, Helvetica, sans-serif;
  color: red;
`;
```

When **The Transformer** is run, pointing at parent directory for these two files, it will create a new file called `MyPage.module.scss`. Any convertable styled-component styles from `MyPage.styles.ts` will be converted and written into the page resulting in a page that looks like the following:
```scss
@use '../../lib/styles/mixins/breakpoints';

.pageContainer {
  width: 100%;
  min-height: 400px;
  background-color: green;

  @include breakpoints.TabletPortraitUp {
    min-height: 300px;
  }
}
```
Note a couple things about the above. Firstly, an `@use` statement has been written into the top of the page. This is done dynamically and the path to each `@use` statement should be correct based on the relative location of this file to the `breakpoints` file.
Secondly, the `PageTitle` style from `MyPage.styles.ts` is omitted from this file. It is modifying a component and therefore doesn't "qualify" for conversion or transferral. The `PageTitle` definition is ignored when **The Transformer** parses the contents of the `MyPage.styles.ts` file.

**The Transformer** would then locate any files within the parent directory where **The Transformer** is running that import `MyPage.styles.ts`. Doing so it would locate `MyPage.tsx` and begin parsing it. It would parse the contents of the file as text looking for exact matches for any of the styles that had been modified in the previous steps. Upon locating a match it would determine if it had found an opening or closing tag. If it were an opening tag it would replace the "S." + [StyledComponentName] with the HTML element that the `styled-component` definition was modifying. Then it would insert `className={styles.[styledComponentName]}` where `styledComponentName` is the new class name that was created in an earlier step. It's just the original `styled-component` name with the first letter shifted to lowercase. Other attributes should remain as they were and any self-closing tags (like `img` tags) should still self-close properly.

Once it had searched through the whole file and made any replacements **The Transformer** will insert an import statement into the top of the document so that `MyPage.tsx` is able to import the styles properly from `MyPage.module.scss`.

So now our original files would all look like the following:
```typescript
// MyPage.tsx
import styles from './Checkout.module.scss'; // --> New!
import * as S from './MyPage.styles';  // Still here b/c of unchanged styled-component

export default function MyPage({title}: PropsWithChildren<{title: string}>) {
  <div className={styles.pageContainer} id={`${title}-page-container'}>
    <S.PageTitle>{title}</S.PageTitle>
    {children}
  </div>
}
```
```typescript
// MyPage.styles.ts
import styled from 'styled-components/macro';
import { PageTitle } from 'components/PageTitle/PageTitle'; 
import { media } from 'lib/media-queries/mixins'; // No longer needed but The Transformer doesn't delete this (yet) :(

export PageTitle = styled(PageTitle)`
  font-family: Arial, Helvetica, sans-serif;
  color: red;
`;
```
and the `.module.scss` file created above would live in the same parent directory as these first two files.

With any luck, there shouldn't be any difference in the appearance of the pages before and after the conversion. There may be a few small linting errors and the like but hopefully those will be easily resolved!

**The Transformer!**
