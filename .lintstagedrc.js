module.exports = {
  '**/*.(md|json)': (filenames) => [
    `npx prettier --write ${filenames.join(' ')}`,
  ],
  '**/*.(ts)': () => ['npx tsc --noEmit'],
  '**/*.(ts|js)': (filenames) => [
    `npx eslint --fix ${filenames.map((filename) => `${filename}`).join(' ')}`,
    `npx prettier --write ${filenames
      .map((filename) => `${filename}`)
      .join(' ')}`,
  ],
};
