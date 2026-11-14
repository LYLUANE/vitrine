/**
 * logger.js
 * Log estruturado com assinantes. No painel, alimenta o console ao vivo;
 * no servidor real, iria para arquivo/Loki/CloudWatch com o mesmo formato.
 */
export class Logger {
  constructor(limite = 400) {
    this.limite = limite;
    this.linhas = [];
    this.assinantes = [];
  }

  /** nivel: 'info' | 'req' | 'ok' | 'aviso' | 'erro' | 'retry' */
  registrar(nivel, mensagem, extra = {}) {
    const linha = { ts: new Date().toISOString(), nivel, mensagem, ...extra };
    this.linhas.push(linha);
    if (this.linhas.length > this.limite) this.linhas.shift();
    this.assinantes.forEach((fn) => fn(linha));
    return linha;
  }

  info(m, e) { return this.registrar('info', m, e); }
  ok(m, e) { return this.registrar('ok', m, e); }
  aviso(m, e) { return this.registrar('aviso', m, e); }
  erro(m, e) { return this.registrar('erro', m, e); }

  assinar(fn) { this.assinantes.push(fn); }
}
