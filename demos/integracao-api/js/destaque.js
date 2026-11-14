/**
 * destaque.js
 * Destaque de sintaxe mínimo (sem biblioteca) para JSON e JavaScript.
 * Um tokenizador por expressão regular basta para trechos de demonstração.
 */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** JSON formatado com classes: chave, texto, número, literal. */
export function destacarJSON(valor) {
  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2);
  return esc(texto).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b|\b(true|false|null)\b/g,
    (m, str, doisPontos, num, lit) => {
      if (str) return doisPontos ? `<span class="t-chave">${str}</span>${doisPontos}` : `<span class="t-texto">${str}</span>`;
      if (num) return `<span class="t-num">${num}</span>`;
      return `<span class="t-lit">${lit}</span>`;
    },
  );
}

const PALAVRAS = new Set(('async await break case catch class const continue default do else export extends ' +
  'finally for from function if import let new of return static super switch this throw try typeof while').split(' '));

/** JavaScript: comentários, textos, template strings, números, palavras-chave e chamadas. */
export function destacarJS(codigo) {
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|\b(\d+(?:\.\d+)?(?:e\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;
  let saida = '', ultimo = 0, m;
  while ((m = re.exec(codigo))) {
    saida += esc(codigo.slice(ultimo, m.index));
    const [tok, coment, str, num, chamada, palavra] = m;
    if (coment) saida += `<span class="t-coment">${esc(tok)}</span>`;
    else if (str) saida += `<span class="t-texto">${esc(tok)}</span>`;
    else if (num) saida += `<span class="t-num">${tok}</span>`;
    else if (chamada) saida += PALAVRAS.has(tok) ? `<span class="t-kw">${tok}</span>` : `<span class="t-fn">${tok}</span>`;
    else if (PALAVRAS.has(palavra)) saida += `<span class="t-kw">${tok}</span>`;
    else if (palavra === 'true' || palavra === 'false' || palavra === 'null') saida += `<span class="t-lit">${tok}</span>`;
    else saida += esc(tok);
    ultimo = re.lastIndex;
  }
  return saida + esc(codigo.slice(ultimo));
}
