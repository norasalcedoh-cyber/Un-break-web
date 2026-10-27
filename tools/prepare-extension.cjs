// Builds a reviewable extension update without modifying the original folder.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../../Extension');
const target = path.resolve(__dirname, '../.extension-preview');
fs.mkdirSync(target, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
manifest.name = 'UN-BREAK';
manifest.version = '0.2.0';
manifest.minimum_chrome_version = '102';
manifest.permissions = [...new Set([...(manifest.permissions || []), 'storage'])];
manifest.background = { service_worker: 'background.js' };
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
let content = fs.readFileSync(path.join(source, 'content.js'), 'utf8');
fs.writeFileSync(path.join(target, 'original-content.js'), content);
const timings = {
  INICIO_KERNING: ['600', '5 * 1000'],
  DURACION_KERNING: ['1500', '4 * 1000'],
  UMBRAL_SCROLL_RAPIDO: ['2', '3'],
  INCREMENTO_SCROLL_RAPIDO: ['400', '250'],
  INICIO_DESAPARICION: ['15 * 1000', '50 * 1000'],
  INTERVALO_DESAPARICION: ['2000', '2500'],
  INICIO_SATURACION_IMAGEN: ['500', '2 * 1000'],
  DURACION_SATURACION_IMAGEN: ['1000', '3 * 1000'],
  INICIO_DEFORMACION_IMAGEN: ['1200', '5 * 1000'],
  DURACION_DEFORMACION_IMAGEN: ['2500', '8 * 1000'],
};
for (const [name, [demo, normal]] of Object.entries(timings)) {
  const original = `const ${name} = ${normal};`;
  if (!content.includes(original)) throw new Error(`Unexpected original configuration: ${name}`);
  content = content.replace(original, `const ${name} = modoDemo ? ${demo} : ${normal};`);
}
// Keep the extra ASCII intervention in normal mode. It would obscure the demo controls.
content = content.replace('iniciarConteoPublicaciones();', 'if (!modoDemo) iniciarConteoPublicaciones();');
const bootstrap = fs.readFileSync(path.join(__dirname, 'demo-bootstrap.js'), 'utf8');
fs.writeFileSync(path.join(target, 'content.js'), `(async () => {\n${bootstrap}\n${content}\n})();\n`);
fs.copyFileSync(path.join(source, 'style.css'), path.join(target, 'style.css'));
fs.copyFileSync(path.join(__dirname, 'demo-background.js'), path.join(target, 'background.js'));
console.log('Prepared .extension-preview. Original Extension folder unchanged.');
