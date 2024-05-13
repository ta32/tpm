/**
 * Load the path definition from an SVG file
 * see: next.config.js webpack config for its configuration
 *
 * Note! This loader won't work with SVGs that have multiple paths
 *
 **/
module.exports = function(content) {
  const svgPath = content.match(/<path d="([^"]+)"/);
  if (svgPath && svgPath[1]) {
    return `module.exports = "${svgPath[1]}";`;
  } else {
    return 'module.exports = null;';
  }
};
