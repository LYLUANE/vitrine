(function () {
  var D = window.DADOS;
  function tc(s) {
    s = Math.floor(s);
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }
  var pct = function (s) { return (s / D.duracao * 100).toFixed(3) + "%"; };

  // régua
  var regua = document.getElementById("regua");
  D.blocos.forEach(function (b) {
    var el = document.createElement("div");
    el.className = "bloco";
    el.style.left = pct(b.de); el.style.width = pct(b.ate - b.de);
    el.innerHTML = "<span>" + b.nome + "</span>";
    regua.appendChild(el);
  });
  D.cortes.forEach(function (c, i) {
    var el = document.createElement("div");
    el.className = "corte";
    el.style.left = pct(c.de); el.style.width = pct(c.ate - c.de);
    el.innerHTML = "<b>" + (i + 1) + "</b>";
    el.title = "Corte " + (i + 1) + ": " + tc(c.de) + " a " + tc(c.ate);
    regua.appendChild(el);
  });
  [0, 300, 600, 900, D.duracao].forEach(function (s, k, arr) {
    var t = document.createElement("span");
    t.className = "tempo" + (k === 0 ? " ini" : k === arr.length - 1 ? " fim" : ""); t.style.left = pct(s);
    t.textContent = tc(s);
    regua.appendChild(t);
  });

  // lista de marcas e cartões
  var marcas = document.getElementById("marcas"), grade = document.getElementById("grade");
  D.cortes.forEach(function (c, i) {
    var li = document.createElement("li");
    li.innerHTML = "<b>Corte " + (i + 1) + " · " + c.titulo + "</b><span class='tc'>" + tc(c.de) + " → " + tc(c.ate) +
      "</span> no original · corte final de " + Math.round(c.final) + " s, " + c.cortes + " jump cuts";
    marcas.appendChild(li);

    var card = document.createElement("article");
    card.className = "card";
    card.innerHTML =
      '<video controls playsinline preload="none" poster="../../img/' + c.poster + '" src="../../video/' + c.video + '"></video>' +
      '<div class="info"><span class="n">' + (i + 1) + '</span><h3>' + c.titulo + '</h3>' +
      '<p class="gancho">Gancho: “' + c.gancho + '”</p>' +
      '<ul class="dados"><li>' + tc(c.de) + "–" + tc(c.ate) + '</li><li>' + Math.round(c.final) + ' s</li><li>' + c.cortes + ' jump cuts</li><li>9:16</li></ul>' +
      '<a class="baixar" href="../../video/' + c.srt + '">Legenda em português (.srt)</a></div>';
    grade.appendChild(card);
  });

  // um vídeo por vez
  document.addEventListener("play", function (e) {
    document.querySelectorAll("video").forEach(function (v) { if (v !== e.target) v.pause(); });
  }, true);

  document.getElementById("cred-fonte").innerHTML = D.credito_fonte;
  document.getElementById("cred-musica").innerHTML = D.credito_musica;
})();
