export const commonParameters = {
    entryPoints: ['src/index.js'],
    platform: 'browser',
    format: 'esm',
    bundle: true,
    loader: {
      '.png': 'dataurl',
      '.jpg': 'file',
      '.svg': 'base64' 
    },
    target: 'es2020',
    outdir: 'dist/',
  };
