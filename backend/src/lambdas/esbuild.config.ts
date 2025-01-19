import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Accept lambda path as argument
const lambdaPath = process.argv[2];
if (!lambdaPath) {
  console.error('❌ Please specify lambda path');
  process.exit(1);
}

console.log(`🔨 Building Lambda: ${lambdaPath}`);

const currentDir = __dirname;
const distPath = path.join(currentDir, lambdaPath, 'dist');
const projectRoot = path.join(currentDir, '../..'); // Points to backend/

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Step 1: Build TypeScript to JavaScript
build({
  entryPoints: [path.join(currentDir, lambdaPath, 'lambda.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(distPath, 'lambda.js'), // Compiled JS output
  minify: true,
  sourcemap: true,
  external: [],
  metafile: true,
  absWorkingDir: projectRoot,
  tsconfig: path.join(projectRoot, 'tsconfig.json'),
  plugins: [{
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: /^@\// }, args => {
        const basePath = path.join(projectRoot, 'src', args.path.replace('@/', ''));
        
        // Try these extensions in order
        const extensions = ['.ts', '.js', '/index.ts', '/index.js', ''];
        
        for (const ext of extensions) {
          const fullPath = basePath + ext;
          if (fs.existsSync(fullPath)) {
            return { path: fullPath };
          }
        }
        
        // If no extension matched but directory exists, assume it has an index
        if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
          return { path: basePath };
        }

        // Default to base path if nothing else matches
        return { path: basePath };
      });
    }
  }]
}).then(result => {
  // Step 2: Create ZIP with compiled JavaScript
  console.log('\n📦 Creating Lambda package...');
  const zipPath = path.join(distPath, `${lambdaPath}.zip`);
  
  // Remove existing zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Create new zip with compiled JavaScript
  execSync(`cd ${distPath} && zip -q -r ${lambdaPath}.zip lambda.js*`);
  
  console.log(`✅ Lambda package created: ${zipPath}`);
  
  // Log bundled dependencies
  if (result.metafile) {
    const deps = Object.keys(result.metafile.inputs).filter(dep => dep.includes('node_modules'));
    console.log('\n📦 Bundled dependencies:');
    deps.forEach(dep => console.log(`- ${dep.split('node_modules/')[1]}`));
  }
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
}); 