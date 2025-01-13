const fs = require('fs');
const path = require('path');

class ExportResourcePathsPlugin {
  constructor(outDir = '../out', publicDir= '../public', outputFile = 'resource-list.json') {
    this.outDir = path.resolve(__dirname, outDir);
    this.publicDir = path.resolve(__dirname, publicDir);
    this.outputFile = path.resolve(this.publicDir, outputFile);
  }

  // Helper function to recursively get all paths
  getAllPaths(dir, basePath = '') {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        results = results.concat(this.getAllPaths(filePath, relativePath));
      } else {
        results.push(`/${relativePath.replace(/\\/g, '/')}`);
      }
    });

    return results;
  }

  transformPathName(path) {
    if (path.includes('.html')) {
      return path.replace('.html', '');
    } else {
      return path;
    }
  }

  apply(compiler) {
    compiler.hooks.done.tap('ExportResourcePathsPlugin', (stats) => {
      this.generatePaths();
    });
  }

  generatePaths() {
    if (!fs.existsSync(this.outDir)) {
      console.error(`Error: "${this.outDir}" folder does not exist.`);
      return;
    }
    const paths = this.getAllPaths(this.outDir);
    const transformedPaths = paths.map(this.transformPathName);
    transformedPaths.push('/');
    fs.writeFileSync(this.outputFile, JSON.stringify(transformedPaths, null, 2));
  }
}

module.exports = ExportResourcePathsPlugin;

// run this script to generate the resource-list.json file
const exporter = new ExportResourcePathsPlugin();
exporter.generatePaths();