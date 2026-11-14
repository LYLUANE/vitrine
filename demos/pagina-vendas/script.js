(function () {
  var doc = document.documentElement;
  doc.classList.add('jsok');
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var foto = /[?&]shot/.test(location.search);

  // revelar ao rolar
  var itens = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !semMovimento && !foto) {
    doc.classList.add('js');
    // pequeno atraso em cascata para itens irmãos
    itens.forEach(function (el) {
      var irmaos = [].slice.call(el.parentNode.children).filter(function (n) { return n.classList.contains('rv'); });
      var i = irmaos.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    itens.forEach(function (el) { io.observe(el); });
  }

  // barra de CTA fixa no celular: aparece depois do hero, some na oferta e no CTA final
  var barra = document.getElementById('barraCta');
  var hero = document.querySelector('.hero');
  var alvos = [document.getElementById('oferta'), document.querySelector('.cta-final')];
  var heroVisivel = true, ofertaVisivel = false;
  function atualizaBarra() {
    var mostra = !heroVisivel && !ofertaVisivel;
    barra.classList.toggle('on', mostra);
    barra.setAttribute('aria-hidden', mostra ? 'false' : 'true');
    barra.querySelector('a').tabIndex = mostra ? 0 : -1;
  }
  if ('IntersectionObserver' in window && barra) {
    new IntersectionObserver(function (e) { heroVisivel = e[0].isIntersecting; atualizaBarra(); }).observe(hero);
    var vistos = new Map();
    var ioOferta = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vistos.set(e.target, e.isIntersecting); });
      ofertaVisivel = [].some.call(alvos, function (a) { return vistos.get(a); });
      atualizaBarra();
    });
    alvos.forEach(function (a) { ioOferta.observe(a); });
  }

  // checkout de demonstração
  var ck = document.getElementById('checkout');
  var ultimoFoco = null;
  function abre() {
    ultimoFoco = document.activeElement;
    ck.classList.add('aberto');
    ck.querySelector('.checkout-box').focus();
  }
  function fecha(ev) {
    if (ev) ev.preventDefault();
    ck.classList.remove('aberto');
    if (location.hash === '#checkout') history.replaceState(null, '', location.pathname + location.search);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  document.querySelectorAll('a[href="#checkout"]').forEach(function (a) {
    a.addEventListener('click', function (ev) { ev.preventDefault(); history.replaceState(null, '', '#checkout'); abre(); });
  });
  document.getElementById('ckFechar').addEventListener('click', fecha);
  ck.addEventListener('click', function (ev) { if (ev.target === ck) fecha(ev); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && ck.classList.contains('aberto')) fecha(ev);
  });
  if (location.hash === '#checkout') abre();
})();
