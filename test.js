/* Движок тестов «Обществознание и котики».
   Данные теста лежат в window.TEST (см. test-baza.html / test-pro.html). */
(function () {
  var T = window.TEST;
  var list = document.getElementById('q-list');
  var KEY = 'oik-test-' + T.id;
  var state = load() || {};

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sameSet(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false; return true; }
  function fmt(arr) { return arr.slice().sort(function (x, y) { return x - y; }).join(''); }

  var LABELS = {
    sud:   { type: 'Верные суждения', hint: 'Отметьте все верные суждения — их может быть несколько.', yes: 'Верно', no: 'Неверно', limit: 0 },
    extra: { type: 'Лишние характеристики', hint: 'Отметьте два термина, которые «выпадают» из общего ряда.', yes: 'Лишнее', no: 'Относится', limit: 2 }
  };

  T.questions.forEach(function (q, qi) {
    var L = LABELS[q.type];
    var st = state[qi] || (state[qi] = { sel: [], done: false });
    var card = el('article', 'q');
    card.id = 'q' + (qi + 1);
    var head = el('div', 'q-head');
    head.appendChild(el('span', 'q-num', String(qi + 1)));
    head.appendChild(el('span', 'q-type', L.type));
    card.appendChild(head);
    card.appendChild(el('p', 'q-text', q.text));
    card.appendChild(el('p', 'q-hint', q.hint || L.hint));

    var ul = el('ul', 'opts');
    var items = [];
    q.opts.forEach(function (o, oi) {
      var n = oi + 1;
      var li = el('li', 'opt');
      li.setAttribute('role', 'checkbox');
      li.setAttribute('tabindex', '0');
      li.appendChild(el('span', 'box', String(n)));
      var t = el('div', 'txt');
      t.appendChild(el('span', '', o));
      t.appendChild(el('span', 'flag', ''));
      var noteText = q.notes && q.notes[n];
      if (noteText) {
        var isAns = q.ans.indexOf(n) >= 0;
        t.appendChild(el('div', 'note', '<b>' + (isAns ? L.yes : L.no) + ':</b> ' + noteText));
      }
      li.appendChild(t);
      li.addEventListener('click', function () { toggle(n); });
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(n); } });
      ul.appendChild(li);
      items.push(li);
    });
    card.appendChild(ul);

    var actions = el('div', 'q-actions');
    var btn = el('button', 'btn', 'Проверить');
    btn.type = 'button';
    var picked = el('span', 'picked', '');
    actions.appendChild(btn);
    actions.appendChild(picked);
    card.appendChild(actions);
    var verdict = el('div', 'verdict');
    card.appendChild(verdict);
    list.appendChild(card);

    function toggle(n) {
      if (st.done) return;
      var i = st.sel.indexOf(n);
      if (i >= 0) st.sel.splice(i, 1);
      else {
        if (L.limit && st.sel.length >= L.limit) st.sel.shift();
        st.sel.push(n);
      }
      save(); paint();
    }

    btn.addEventListener('click', function () {
      if (!st.sel.length || st.done) return;
      st.done = true; st.ok = sameSet(st.sel, q.ans);
      save(); paint(); update();
    });

    function paint() {
      items.forEach(function (li, oi) {
        var n = oi + 1, s = st.sel.indexOf(n) >= 0, a = q.ans.indexOf(n) >= 0;
        var flag = li.querySelector('.flag');
        li.className = 'opt';
        li.setAttribute('aria-checked', s ? 'true' : 'false');
        flag.textContent = '';
        if (!st.done) { if (s) li.classList.add('sel'); return; }
        if (s && a) { li.classList.add('right'); flag.textContent = '✓'; }
        else if (s && !a) { li.classList.add('wrong'); flag.textContent = '✗ ошибка'; }
        else if (!s && a) { li.classList.add('missed'); flag.textContent = '← надо было выбрать'; }
      });
      picked.textContent = st.done ? '' : (st.sel.length ? 'Выбрано: ' + fmt(st.sel) : 'Ничего не выбрано');
      btn.disabled = st.done || !st.sel.length;
      btn.style.display = st.done ? 'none' : '';
      card.classList.toggle('done', st.done);
      if (st.done) {
        verdict.className = 'verdict ' + (st.ok ? 'good' : 'bad');
        verdict.innerHTML = '<strong>' + (st.ok ? 'Верно! 🐾' : 'Неверно') + '</strong>' +
          'Правильный ответ: <b>' + fmt(q.ans) + '</b>' + (st.ok ? '' : ' · ваш ответ: ' + fmt(st.sel)) +
          (q.explain ? '<p>' + q.explain + '</p>' : '') +
          (q.notes ? '<p style="color:var(--muted);font-size:14px">Пояснения — под каждым вариантом.</p>' : '');
      }
    }
    paint();
  });

  var bar = document.getElementById('bar');
  var cnt = document.getElementById('cnt');
  var okc = document.getElementById('okc');
  var res = document.getElementById('result');

  function update() {
    var total = T.questions.length, done = 0, ok = 0;
    T.questions.forEach(function (q, i) { var s = state[i]; if (s && s.done) { done++; if (s.ok) ok++; } });
    bar.style.width = (done / total * 100) + '%';
    cnt.textContent = done + ' из ' + total;
    okc.textContent = ok;
    if (done === total) {
      res.classList.add('show');
      document.getElementById('score').textContent = ok + ' / ' + total;
      var r = ok / total, msg;
      if (r === 1) msg = 'Идеально! Ни одной ошибки — котики гордятся вами.';
      else if (r >= 0.8) msg = 'Отличный результат! Посмотрите пояснения к заданиям с ошибками.';
      else if (r >= 0.5) msg = 'Неплохо, но есть что подтянуть. Перечитайте запоминашку и разберите ошибки.';
      else msg = 'Стоит вернуться к конспектам и запоминашке, а потом пройти тест ещё раз.';
      document.getElementById('msg').textContent = msg;
    } else res.classList.remove('show');
  }
  update();

  document.getElementById('restart').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    window.scrollTo(0, 0); location.reload();
  });
})();
