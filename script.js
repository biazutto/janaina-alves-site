(() => {
  'use strict';

  /* ---------- Configuração do salão ---------- */
  const CONFIG = {
    whatsapp: '5511941584459',
    profissional: 'Janaína',
    abre: 10,            // primeiro horário: 10:00
    fecha: 19,           // salão fecha às 19:00
    intervaloMin: 30,
    diasFechados: [1],   // 0 = domingo ... 1 = segunda (fechado)
    mesesAFrente: 2,
  };

  const SERVICES = [
    { nome: 'Corte', desc: 'Corte personalizado conforme o formato desejado.' },
    { nome: 'Escova', desc: 'Modelagem dos fios com escova e finalização.' },
    { nome: 'Coloração', desc: 'Aplicação de cor em toda a extensão dos fios.' },
    { nome: 'Iluminação', desc: 'Clareamento parcial para efeito iluminado.' },
    { nome: 'Tratamento', desc: 'Protocolo definido conforme a necessidade dos fios.' },
    { nome: 'Progressiva', desc: 'Escova progressiva e orgânica, cabelos lisos e com brilho intenso.' },
    { nome: 'Selagem', desc: 'Alinhamento da fibra e redução do frizz.' },
    { nome: 'Diagnóstico', desc: 'Avaliação da estrutura e resistência capilar.' },
    { nome: 'Penteado', desc: 'Modelagem dos fios para ocasiões específicas.' },
    { nome: 'Maquiagem', desc: 'Preparação da pele e aplicação de maquiagem.' },
  ];
  // Ordem visual da grade "Todos serviços" (duas colunas, leitura por linha)
  const GRID_ORDER = ['Corte', 'Progressiva', 'Escova', 'Selagem', 'Coloração', 'Diagnóstico', 'Iluminação', 'Penteado', 'Tratamento', 'Maquiagem'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const state = { service: null, date: null, time: null, view: null };

  /* ---------- Acordeões do agendamento ---------- */
  const toggle = $('#booking-toggle');
  const body = $('#booking-body');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
  });

  function setPill(id, open) {
    const pill = $('#pill-' + id);
    $('.pill__btn', pill).setAttribute('aria-expanded', String(open));
    $('#panel-' + id).hidden = !open;
    // Só um campo aberto por vez
    if (open) {
      ['service', 'date'].filter(other => other !== id).forEach(other => {
        $('.pill__btn', $('#pill-' + other)).setAttribute('aria-expanded', 'false');
        $('#panel-' + other).hidden = true;
      });
    }
  }
  ['service', 'date'].forEach(id => {
    $('.pill__btn', $('#pill-' + id)).addEventListener('click', () => {
      setPill(id, $('#panel-' + id).hidden);
    });
  });

  /* ---------- Serviços (seletor + grade) ---------- */
  const optList = $('#service-options');
  SERVICES.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = '<button type="button" aria-pressed="false"></button>';
    const b = li.firstChild;
    b.textContent = s.nome;
    b.addEventListener('click', () => chooseService(s.nome, true));
    optList.appendChild(li);
  });

  function chooseService(nome, advance) {
    state.service = nome;
    $$('button', optList).forEach(b => b.setAttribute('aria-pressed', String(b.textContent === nome)));
    $('#label-service').textContent = nome;
    $('#pill-service').classList.add('is-set');
    setPill('service', false);
    if (advance && !state.date) setPill('date', true);
    render();
  }

  const grid = $('#services');
  const cols = [document.createElement('div'), document.createElement('div')];
  cols.forEach(col => { col.className = 'services__col'; grid.appendChild(col); });
  GRID_ORDER.forEach((nome, i) => {
    const s = SERVICES.find(x => x.nome === nome);
    const el = document.createElement('div');
    el.className = 'service lumi';
    el.dataset.variant = 'original';
    el.dataset.color = 'gold';
    el.innerHTML = '<button type="button" aria-expanded="false"><span class="service__label"><span class="service__name"></span><span class="service__hint" aria-hidden="true">Ver detalhes</span></span><svg class="ico"><use href="#i-down"/></svg></button><p></p>';
    $('.service__name', el).textContent = s.nome;
    $('p', el).textContent = s.desc;
    $('button', el).addEventListener('click', () => {
      const willOpen = !el.classList.contains('is-open');
      // Só um serviço aberto por vez
      $$('.service.is-open', grid).forEach(other => {
        other.classList.remove('is-open');
        $('button', other).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        el.classList.add('is-open');
        $('button', el).setAttribute('aria-expanded', 'true');
      }
    });
    cols[i % 2].appendChild(el);
  });

  /* ---------- Calendário ---------- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() + CONFIG.mesesAFrente, 1);
  state.view = new Date(firstMonth);

  const fmtMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
  const fmtWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  const sameDay = (a, b) => a && b && a.getTime() === b.getTime();

  function renderCalendar() {
    const v = state.view;
    $('#cal-title').textContent = `${cap(fmtMonthName.format(v))} ${v.getFullYear()}`;
    $('#cal-prev').disabled = v <= firstMonth;
    $('#cal-next').disabled = v >= lastMonth;

    const cal = $('#cal-grid');
    cal.innerHTML = '';
    const offset = v.getDay();
    const days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
    for (let i = 0; i < offset; i++) {
      cal.insertAdjacentHTML('beforeend', '<span class="cal__day is-empty"></span>');
    }
    for (let d = 1; d <= days; d++) {
      const date = new Date(v.getFullYear(), v.getMonth(), d);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal__day';
      b.textContent = d;
      const closed = CONFIG.diasFechados.includes(date.getDay());
      const past = date < today;
      const noSlots = sameDay(date, today) && slotsFor(date).every(s => s.taken);
      b.disabled = closed || past || noSlots;
      b.setAttribute('aria-pressed', String(sameDay(date, state.date)));
      if (closed) b.title = 'Fechado às segundas';
      b.addEventListener('click', () => {
        state.date = date;
        if (state.time && slotsFor(date).find(s => s.label === state.time)?.taken) state.time = null;
        render();
        $('#times').scrollTo({ left: 0 });
      });
      cal.appendChild(b);
    }
  }
  $('#cal-prev').addEventListener('click', () => { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1); renderCalendar(); });
  $('#cal-next').addEventListener('click', () => { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1); renderCalendar(); });

  /* ---------- Horários ---------- */
  function slotsFor(date) {
    const out = [];
    const now = new Date();
    for (let m = CONFIG.abre * 60; m < CONFIG.fecha * 60; m += CONFIG.intervaloMin) {
      const h = Math.floor(m / 60), min = m % 60;
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min);
      out.push({ label: `${pad(h)}:${pad(min)}`, taken: at <= now });
    }
    return out;
  }

  function renderTimes() {
    const track = $('#times');
    track.innerHTML = '';
    const hint = $('#times-hint');
    // Sem dia escolhido, mostra a grade de horários desabilitada como referência
    const ref = state.date || new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    hint.hidden = !!state.date;
    hint.textContent = 'Escolha um dia para liberar os horários.';
    slotsFor(ref).forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'time' + (state.date && s.taken ? ' is-past' : '');
      b.textContent = s.label;
      b.disabled = !state.date || s.taken;
      b.setAttribute('aria-pressed', String(state.time === s.label));
      b.addEventListener('click', () => { state.time = s.label; render(); });
      track.appendChild(b);
    });
  }
  const scrollTimes = dir => $('#times').scrollBy({ left: dir * 220, behavior: 'smooth' });
  $('#times-prev').addEventListener('click', () => scrollTimes(-1));
  $('#times-next').addEventListener('click', () => scrollTimes(1));

  /* ---------- Resumo e envio ---------- */
  function humanTime(t) {
    const [h, m] = t.split(':').map(Number);
    return m ? `${h}h${pad(m)}` : `${h} horas`;
  }

  function renderSummary() {
    const set = (id, txt, ok) => {
      const el = $(id);
      el.textContent = txt;
      el.parentElement.classList.toggle('is-set', ok);
    };
    set('#sum-service', state.service || 'Escolha o serviço', !!state.service);
    set('#sum-date', state.date ? `dia ${state.date.getDate()} - ${cap(fmtWeekday.format(state.date))}` : 'Escolha o dia', !!state.date);
    set('#sum-time', state.time ? `às ${humanTime(state.time)}` : 'Escolha o horário', !!state.time);

    if (state.date) {
      const label = $('#label-date');
      label.textContent = state.time
        ? `${pad(state.date.getDate())}/${pad(state.date.getMonth() + 1)} · ${state.time}`
        : `${pad(state.date.getDate())}/${pad(state.date.getMonth() + 1)} · escolha o horário`;
      $('#pill-date').classList.add('is-set');
    }
    $('#btn-send').disabled = !(state.service && state.date && state.time);
  }

  function render() {
    renderCalendar();
    renderTimes();
    renderSummary();
  }

  function whatsappUrl(text) {
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  $('#btn-send').addEventListener('click', () => {
    const d = state.date;
    const dataLonga = `${cap(fmtWeekday.format(d))}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const msg = [
      `Olá, ${CONFIG.profissional}! Gostaria de fazer um agendamento:`,
      '',
      `Serviço: ${state.service}`,
      `Data: ${dataLonga}`,
      `Horário: ${state.time}`,
      '',
      'Pode confirmar pra mim?',
    ].join('\n');
    window.open(whatsappUrl(msg), '_blank', 'noopener');
  });

  $('#btn-edit').addEventListener('click', () => {
    setPill('service', true);
    $('#pill-service').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Botões "Fazer meu agendamento" das especialidades
  $$('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    if (body.hidden) toggle.click();
    chooseService(btn.dataset.book, true);
    $('#agendamento').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* ---------- Galeria com dots e leve inclinação ---------- */
  const gTrack = $('#gallery');
  const gItems = $$('figure', gTrack);
  const dots = $('#gallery-dots');
  gItems.forEach(() => dots.appendChild(document.createElement('i')));
  function updateGallery() {
    const c = gTrack.scrollLeft + gTrack.clientWidth / 2;
    let best = 0, bestD = Infinity;
    gItems.forEach((f, i) => {
      const mid = f.offsetLeft + f.offsetWidth / 2;
      const off = Math.max(-1, Math.min(1, (mid - c) / f.offsetWidth));
      f.style.transform = `rotate(${off * 4}deg) scale(${1 - Math.abs(off) * .06})`;
      if (Math.abs(mid - c) < bestD) { bestD = Math.abs(mid - c); best = i; }
    });
    $$('i', dots).forEach((d, i) => d.classList.toggle('is-on', i === best));
  }
  gTrack.addEventListener('scroll', () => requestAnimationFrame(updateGallery), { passive: true });
  window.addEventListener('load', () => {
    const second = gItems[1];
    gTrack.scrollLeft = second.offsetLeft - (gTrack.clientWidth - second.offsetWidth) / 2;
    updateGallery();
  });
  window.addEventListener('resize', updateGallery);

  /* ---------- FAQ: só uma pergunta aberta por vez ---------- */
  const faq = $$('#faq details');
  faq.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ---------- Produtos ---------- */
  const pTrack = $('#products');
  const products = [...pTrack.children];
  const cardStep = () => pTrack.firstElementChild.offsetWidth + 18;
  const clearZoom = () => products.forEach(p => p.classList.remove('is-zoom'));
  const step = dir => {
    // produto que vai ficar no centro: recebe o zoom suave na foto
    const cur = Math.round(pTrack.scrollLeft / cardStep());
    const next = Math.max(0, Math.min(products.length - 1, cur + dir));
    clearZoom();
    products[next].classList.add('is-zoom');
    pTrack.scrollBy({ left: dir * cardStep(), behavior: 'smooth' });
  };
  // ao arrastar com o dedo, o zoom das setas sai de cena
  pTrack.addEventListener('pointerdown', clearZoom, { passive: true });
  $('#prod-prev').addEventListener('click', () => step(-1));
  $('#prod-next').addEventListener('click', () => step(1));
  $$('[data-buy]').forEach(btn => btn.addEventListener('click', () => {
    const name = btn.closest('.product').dataset.name;
    window.open(whatsappUrl(`Olá, ${CONFIG.profissional}! Tenho interesse no ${name}. Ele está disponível?`), '_blank', 'noopener');
  }));


  /* ---------- Animações no celular ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Luz da borda girada por JS: funciona igual em qualquer iPhone (não depende de @property animado)
  // e só anima o que está visível na tela.
  {
    const spinners = [
      ...$$('.lumi[data-variant="original"]').map(el => ({ el, prop: '--orbit-deg', period: 2400, deg: Math.random() * 360, mult: 1, boost: false, seen: false })),
      ...$$('.shiny-buy').map(el => ({ el, prop: '--gradient-angle', period: 3000, deg: 0, mult: 1, boost: true, seen: false })),
    ];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        const s = spinners.find(x => x.el === e.target); if (s) s.seen = e.isIntersecting;
      }), { rootMargin: '80px' });
      spinners.forEach(s => io.observe(s.el));
    } else { spinners.forEach(s => { s.seen = true; }); }

    // no toque não existe hover: encostar no botão "acende" a luz por um instante
    $$('.shiny-buy').forEach(el => {
      let t = 0;
      el.addEventListener('pointerdown', () => { el.classList.add('is-hot'); clearTimeout(t); t = setTimeout(() => el.classList.remove('is-hot'), 1500); }, { passive: true });
    });

    let last = performance.now();
    const tick = now => {
      const dt = Math.min(now - last, 100); last = now;
      if (!document.hidden) {
        spinners.forEach(s => {
          if (!s.seen) return;
          if (s.el.matches('.service:not(.is-open), .faq details:not([open])')) return;   // sem luz nos fechados
          const hot = s.boost && (s.el.matches(':hover') || s.el.classList.contains('is-hot'));
          s.mult += ((hot ? 2.6 : 1) - s.mult) * 0.08;
          s.deg = (s.deg + (dt / s.period) * 360 * s.mult) % 360;
          s.el.style.setProperty(s.prop, s.deg.toFixed(1) + 'deg');
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Entrada suave dos blocos ao rolar
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const targets = [
      ...$$('.section h2, .section__sub, .card, .about__img, .about__text, .review, .map, .map__addr, .faq details, .products, .stats > div, .gallery'),
      ...$$('.services__col').flatMap(col => $$('.service', col)),
    ];
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add('is-in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el, i) => {
      if (seen.has(el)) return;
      seen.add(el);
      const siblings = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--d', Math.min(siblings, 5) * 0.06 + 's');
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // Galeria com autoplay suave (pausa quando a pessoa mexe)
  if (!reduceMotion) {
    let paused = false, resume = 0, visible = false;
    const pause = () => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; }, 7000); };
    ['touchstart', 'pointerdown', 'wheel'].forEach(ev => gTrack.addEventListener(ev, pause, { passive: true }));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(gTrack);
    } else { visible = true; }
    setInterval(() => {
      if (paused || !visible || document.hidden) return;
      const center = gTrack.scrollLeft + gTrack.clientWidth / 2;
      let idx = gItems.findIndex(f => f.offsetLeft + f.offsetWidth / 2 > center + 4);
      if (idx < 0) idx = 0;
      const f = gItems[idx];
      gTrack.scrollTo({ left: f.offsetLeft - (gTrack.clientWidth - f.offsetWidth) / 2, behavior: 'smooth' });
    }, 3800);
  }

  /* ---------- Menu bolacha ---------- */
  {
    const btn = $('#menu-btn'), panel = $('#menu-panel'), backdrop = $('#menu-backdrop');
    const links = $$('a', panel);
    const setMenu = open => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      panel.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
    };
    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    backdrop.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    panel.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return;
      setMenu(false);
      if (a.getAttribute('href') === '#agendamento' && body.hidden) toggle.click();   // abre o formulário junto
    });

    // destaca no menu a seção em que a pessoa está
    const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    let ticking = false;
    const spy = () => {
      ticking = false;
      const line = innerHeight * 0.35;
      let current = targets[0];
      targets.forEach(t => { if (t.getBoundingClientRect().top <= line) current = t; });
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) current = targets[targets.length - 1];
      links.forEach(a => a.classList.toggle('is-active', $(a.getAttribute('href')) === current));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    addEventListener('resize', spy);
    spy();
  }

  /* ---------- Diagnóstico (só com ?debug na URL) ---------- */
  if (location.search.includes('debug')) {
    const mq = q => window.matchMedia(q).matches;
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.85);color:#fff;font:12px/1.5 monospace;white-space:pre-wrap;pointer-events:none';
    const paint = () => {
      const buy = document.querySelector('.shiny-buy');
      const top = document.querySelector('.lumi');
      const shine = buy ? getComputedStyle(buy, '::after').animationName : '(sem botão)';
      box.textContent = [
        'reduzir movimento: ' + (mq('(prefers-reduced-motion: reduce)') ? 'LIGADO (desliga brilho/entradas)' : 'desligado'),
        'hover: ' + (mq('(hover: none)') ? 'none (toque)' : 'hover (mouse)'),
        '@property: ' + ((window.CSS && CSS.registerProperty) ? 'ok' : 'SEM SUPORTE'),
        'faixa de luz do Comprar: ' + shine,
        'luz do topo (JS): ' + (top.style.getPropertyValue('--orbit-deg') || 'parado'),
        'luz do Comprar (JS): ' + (buy && buy.style.getPropertyValue('--gradient-angle') || 'fora da tela'),
        'largura: ' + innerWidth,
      ].join('\n');
    };
    paint(); setInterval(paint, 500);
    document.body.appendChild(box);
  }

  render();
})();
