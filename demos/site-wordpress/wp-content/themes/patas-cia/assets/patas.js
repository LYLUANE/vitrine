(function(){
  var h=document.getElementById('site-header'), b=h&&h.querySelector('.pt-burger');
  if(b){b.addEventListener('click',function(){var o=h.classList.toggle('is-open');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Fechar menu':'Abrir menu');});}
  document.querySelectorAll('form.pt-form').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();f.classList.add('enviado');var ok=f.querySelector('.pt-ok');if(ok){ok.focus&&ok.focus();}});
  });
})();
