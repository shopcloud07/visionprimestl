/* ============================================================
   CONSTRUIR: embute o CSS dentro do index.html
   ------------------------------------------------------------
   POR QUE: o <link rel="stylesheet"> bloqueia a renderizacao.
   O navegador nao pinta NADA ate o arquivo chegar - por isso a
   tela fica branca no comeco. Embutindo o CSS no proprio HTML,
   ele chega junto com a pagina e some um round trip inteiro.
   Medido: 1a pintura 1224ms -> 981ms, Speed Index 2289 -> 1939ms,
   nota 99 -> 100 (3 rodadas de cada, com TTFB de 600ms).

   COMO USAR: edite css/styles.css normalmente. Depois rode:

       node construir.js

   O index.html e reescrito com o estilo atualizado.
   Os arquivos que voce edita continuam sendo os de css/.

   Rodar duas vezes seguidas nao duplica nada: o script troca o
   conteudo entre os marcadores CSS-EMBUTIDO.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const HTML = path.join(RAIZ, 'index.html');
const FOLHAS = ['css/css2.css', 'css/styles.css']; // a ordem importa: fonte antes dos estilos

const INICIO = '<!-- CSS-EMBUTIDO:INICIO - gerado por construir.js. NAO edite aqui: edite css/styles.css e rode "node construir.js" -->';
const FIM = '<!-- CSS-EMBUTIDO:FIM -->';

// --- desfazer: volta aos <link>, do jeito que era antes de embutir ---
// uso: node construir.js --desfazer
if (process.argv.includes('--desfazer')) {
  let h = fs.readFileSync(HTML, 'utf8');
  const i = h.indexOf(INICIO), f = h.indexOf(FIM);
  if (i === -1 || f === -1) { console.log('o index.html ja esta com os <link> separados. nada a fazer.'); process.exit(0); }
  const links = '<link href="css/css2.css" rel="stylesheet">\n    ' +
                '<link rel="stylesheet" href="css/styles.css?v=1355">';
  h = h.slice(0, i) + links + h.slice(f + FIM.length);
  fs.writeFileSync(HTML, h);
  console.log('desfeito: o index.html voltou a carregar css/css2.css e css/styles.css por <link>.');
  process.exit(0);
}

// --- 1. junta as folhas de estilo ---
let css = '';
for (const arq of FOLHAS) {
  const caminho = path.join(RAIZ, arq);
  if (!fs.existsSync(caminho)) { console.error('nao encontrei ' + arq); process.exit(1); }
  css += '\n/* ===== ' + arq + ' ===== */\n' + fs.readFileSync(caminho, 'utf8');
}

// As urls dentro de css/ eram relativas a essa pasta. Agora o estilo vive no
// index.html, que fica um nivel acima: ../fonts/ vira fonts/.
const antes = css;
css = css.replace(/url\(\s*(['"]?)\.\.\//g, 'url($1');
const reescritas = (antes.match(/url\(\s*['"]?\.\.\//g) || []).length;

const bloco = INICIO + '\n<style>' + css + '\n</style>\n    ' + FIM;

// --- 2. injeta no HTML ---
let html = fs.readFileSync(HTML, 'utf8');
const original = html;

if (html.includes(INICIO) && html.includes(FIM)) {
  // ja foi construido antes: so troca o miolo
  const i = html.indexOf(INICIO);
  const f = html.indexOf(FIM) + FIM.length;
  html = html.slice(0, i) + bloco + html.slice(f);
} else {
  // primeira vez: os <link> das folhas dao lugar ao bloco embutido
  let trocou = false;
  html = html.replace(/[ \t]*<link[^>]+href="css\/css2\.css"[^>]*>\n?/i, () => { trocou = true; return ''; });
  html = html.replace(/([ \t]*)<link[^>]+href="css\/styles\.css[^"]*"[^>]*>/i, (m, esp) => {
    trocou = true; return esp + bloco;
  });
  if (!trocou) {
    console.error('nao achei os <link> de css nem os marcadores no index.html.');
    console.error('o arquivo pode ter sido alterado a mao - confira antes de rodar de novo.');
    process.exit(1);
  }
}

if (html === original) { console.log('nada mudou.'); process.exit(0); }
fs.writeFileSync(HTML, html);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('index.html reescrito com o CSS embutido.');
console.log('  css embutido : ' + kb(css.length) + (reescritas ? '  (' + reescritas + ' caminho(s) ../ reescrito(s))' : ''));
console.log('  index.html   : ' + kb(original.length) + ' -> ' + kb(html.length));
console.log('\nlembre: o que voce edita continua sendo css/styles.css.');
