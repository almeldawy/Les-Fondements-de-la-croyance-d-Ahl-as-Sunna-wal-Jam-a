(function(){
  var KEY = 'usul-aqida-';
  function get(k, d){ try{ var v = localStorage.getItem(KEY+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
  function set(k, v){ try{ localStorage.setItem(KEY+k, JSON.stringify(v)); }catch(e){} }

  var root = document.documentElement;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var toc = document.getElementById('toc');
  var read = get('read', {});
  var bookmarks = get('bookmarks', []);

  /* ---------- Thème ---------- */
  var theme = get('theme', null);
  if (theme) root.setAttribute('data-theme', theme);
  function isDark(){
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintThemeBtn(){ document.getElementById('theme-ico').textContent = isDark() ? '☀' : '☾'; }
  document.getElementById('theme-btn').onclick = function(){
    var t = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', t); set('theme', t); paintThemeBtn();
  };
  paintThemeBtn();

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('show'); }, 1800); }

  /* ---------- Sommaire ---------- */
  chapters.forEach(function(ch){
    var a = document.createElement('a');
    a.href = '#' + ch.id;
    a.dataset.id = ch.id;
    a.innerHTML = '<span class="dot"></span><span>' + ch.dataset.toc + '</span>';
    a.onclick = function(){ document.body.classList.remove('side-open'); };
    toc.appendChild(a);

    /* bouton marque-page */
    var b = ch.querySelector('.bm-btn');
    b.onclick = function(){ toggleBookmark(ch); };
    /* bouton « marquer comme lu » */
    var m = document.createElement('button');
    m.className = 'btn mark-read';
    ch.appendChild(m);
    m.onclick = function(){ read[ch.id] = !read[ch.id]; set('read', read); refreshProgress(); };
  });

  /* ---------- Progression ---------- */
  function refreshProgress(){
    var n = 0;
    chapters.forEach(function(ch){
      var r = !!read[ch.id]; if (r) n++;
      toc.querySelector('[data-id="'+ch.id+'"]').classList.toggle('read', r);
      ch.querySelector('.mark-read').textContent = r ? '✓ Chapitre lu — annuler' : 'Marquer ce chapitre comme lu';
    });
    var pct = Math.round(n / chapters.length * 100);
    document.getElementById('prog-fill').style.width = pct + '%';
    document.getElementById('prog-txt').textContent = n + ' / ' + chapters.length + ' chapitres lus (' + pct + ' %)';
  }
  document.getElementById('reset-btn').onclick = function(){
    if (!confirm('Réinitialiser toute la progression de lecture ?')) return;
    read = {}; set('read', read); set('pos', 0); refreshProgress(); toast('Progression réinitialisée');
  };

  /* lecture automatique : chapitre marqué lu quand sa fin est atteinte */
  var current = null;
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    document.getElementById('progress-bar').style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + '%';
    var cur = null;
    chapters.forEach(function(ch){
      var r = ch.getBoundingClientRect();
      if (r.top < 140) cur = ch;
      if (!read[ch.id] && r.bottom < h.clientHeight - 40 && r.bottom > 0 && r.top < 0) { read[ch.id] = true; set('read', read); refreshProgress(); }
    });
    if (cur !== current){
      current = cur;
      toc.querySelectorAll('a').forEach(function(a){ a.classList.toggle('current', cur && a.dataset.id === cur.id); });
    }
    set('pos', h.scrollTop);
  }
  var ticking = false;
  window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(function(){ onScroll(); ticking = false; }); } });

  /* ---------- Marque-pages ---------- */
  function toggleBookmark(ch){
    var i = bookmarks.findIndex(function(b){ return b.id === ch.id; });
    if (i >= 0){ bookmarks.splice(i, 1); toast('Marque-page retiré'); }
    else { bookmarks.push({ id: ch.id, title: ch.dataset.toc, date: new Date().toLocaleDateString('fr-FR') }); toast('Marque-page ajouté'); }
    set('bookmarks', bookmarks); renderBookmarks();
  }
  function renderBookmarks(){
    var box = document.getElementById('bookmarks');
    box.innerHTML = bookmarks.length ? '' : '<p class="empty">Aucun marque-page. Cliquez sur 🔖 en haut d\'un chapitre pour en ajouter un.</p>';
    bookmarks.forEach(function(b, i){
      var d = document.createElement('div'); d.className = 'bm';
      d.innerHTML = '<a href="#'+b.id+'">'+b.title+'<small>Ajouté le '+b.date+'</small></a><button title="Supprimer">✕</button>';
      d.querySelector('a').onclick = function(){ document.body.classList.remove('side-open'); };
      d.querySelector('button').onclick = function(){ bookmarks.splice(i, 1); set('bookmarks', bookmarks); renderBookmarks(); };
      box.appendChild(d);
    });
    chapters.forEach(function(ch){
      var on = bookmarks.some(function(b){ return b.id === ch.id; });
      var btn = ch.querySelector('.bm-btn'); btn.classList.toggle('on', on);
      btn.title = on ? 'Retirer le marque-page' : 'Ajouter un marque-page';
    });
  }

  /* ---------- Onglets & menu ---------- */
  document.querySelectorAll('.tabs button').forEach(function(t){
    t.onclick = function(){
      document.querySelectorAll('.tabs button').forEach(function(x){ x.classList.toggle('active', x === t); });
      document.getElementById('toc').hidden = t.dataset.tab !== 'toc';
      document.getElementById('bookmarks').hidden = t.dataset.tab !== 'bm';
    };
  });
  document.getElementById('menu-btn').onclick = function(){ document.body.classList.toggle('side-open'); };
  document.querySelector('.overlay').onclick = function(){ document.body.classList.remove('side-open'); };

  /* ---------- Reprise de lecture ---------- */
  document.getElementById('resume-btn').onclick = function(){
    var p = get('pos', 0);
    if (p > 100) window.scrollTo({ top: p, behavior: 'smooth' });
    else toast('Aucune position enregistrée');
  };

  refreshProgress(); renderBookmarks(); onScroll();
})();
