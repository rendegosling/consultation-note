const { build } = require('esbuild');
const path = require('path');

console.log('🔨 Building Lambda with dependencies...');

build({
  entryPoints: [path.join(__dirname, 'lambda.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(__dirname, 'dist/lambda.js'),
  minify: true,
  sourcemap: true,
  external: [], // Bundle everything
  metafile: true, // Generate meta file for dependency analysis
  plugins: [{
    name: 'alias',
    setup(build) {
      // Handle @ imports
      build.onResolve({ filter: /^@\// }, args => {
        const resolvedPath = path.resolve(__dirname, '../../', args.path.replace('@/', ''));
        const extensions = ['.ts', '.js', '/index.ts', '/index.js'];
        for (const ext of extensions) {
          const fullPath = resolvedPath + ext;
          try {
            require('fs').accessSync(fullPath);
            return { path: fullPath };
          } catch {}
        }
        return { path: resolvedPath };
      });
    }
  }]
}).then(result => {
  // Log bundled dependencies
  if (result.metafile) {
    const deps = Object.keys(result.metafile.inputs).filter(dep => dep.includes('node_modules'));
    console.log('\n📦 Bundled dependencies:');
    deps.forEach(dep => console.log(`- ${dep.split('node_modules/')[1]}`));
  }
}).catch(() => process.exit(1));