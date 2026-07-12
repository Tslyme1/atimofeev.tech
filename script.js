document.addEventListener('DOMContentLoaded', () => {
  // ---------- Nav drawer (menu fab on case pages) ----------
  const fab = document.getElementById('menuFab');
  const drawer = document.getElementById('navDrawer');
  const scrim = document.getElementById('scrim');
  const closeBtn = document.getElementById('navClose');

  function openDrawer(){ drawer?.classList.add('is-open'); scrim?.classList.add('is-open'); }
  function closeDrawer(){ drawer?.classList.remove('is-open'); scrim?.classList.remove('is-open'); }

  fab?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  scrim?.addEventListener('click', closeDrawer);

  // ---------- Case modal (icon+title+TOC+profile), opened by the right-side menu fab ----------
  const caseModal = document.getElementById('caseModal');
  const caseOverlay = document.getElementById('caseOverlay');
  const caseClose = document.getElementById('caseClose');

  function openCaseModal(){
    caseModal?.classList.add('is-open');
    caseOverlay?.classList.add('is-open');
  }
  function closeCaseModal(){
    caseModal?.classList.remove('is-open');
    caseOverlay?.classList.remove('is-open');
  }
  if (caseModal){
    fab?.addEventListener('click', openCaseModal);
    caseClose?.addEventListener('click', closeCaseModal);
    caseOverlay?.addEventListener('click', closeCaseModal);
    caseModal.querySelectorAll('.case-modal__toc a').forEach(a => a.addEventListener('click', closeCaseModal));
  }

  // ---------- Profile modal (burger on tablet/mobile) ----------
  const profileBurger = document.getElementById('profileBurger');
  const profileModal = document.getElementById('profileModal');
  const profileClose = document.getElementById('profileClose');
  const profileOverlay = document.getElementById('profileOverlay');

  function openProfile(){
    profileModal?.classList.add('is-open');
    profileOverlay?.classList.add('is-open');
  }
  function closeProfile(){
    profileModal?.classList.remove('is-open');
    profileOverlay?.classList.remove('is-open');
  }
  profileBurger?.addEventListener('click', openProfile);
  profileClose?.addEventListener('click', closeProfile);
  profileOverlay?.addEventListener('click', closeProfile);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){ closeDrawer(); closeProfile(); closeCaseModal(); }
  });

  // ---------- TOC scroll-spy (subnav + case modal) ----------
  const tocLinks = document.querySelectorAll('.subnav .toc a[href^="#"], .case-modal__toc a[href^="#"]');
  if (tocLinks.length){
    const sections = [...new Set(Array.from(tocLinks)
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean))];
    function setActiveTOC(id){
      tocLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    }
    function updateSpy(){
      const line = window.innerHeight * 0.4;
      let current = sections[0];
      sections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= line) current = sec;
      });
      if (current) setActiveTOC(current.id);
    }
    window.addEventListener('scroll', updateSpy, { passive:true });
    window.addEventListener('resize', updateSpy);
    updateSpy();
  }

  // ---------- Horizontal sliders: wheel-to-scroll + right-edge fade ----------
  document.querySelectorAll('.card-slider, .phone-scroll, .funnel').forEach(el => {
    const maskTarget = el.closest('.shot-card') || el;
    function updateFade(){
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      maskTarget.classList.toggle('at-end', atEnd || el.scrollWidth <= el.clientWidth);
    }
    el.addEventListener('wheel', (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // Normalize line/page deltaMode to roughly pixel units so trackpads and notched mice both feel right
      const unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? el.clientHeight : 1);
      el.scrollLeft += e.deltaY * unit;
      e.preventDefault();
    }, { passive:false });
    el.addEventListener('scroll', updateFade, { passive:true });
    window.addEventListener('resize', updateFade);
    updateFade();
  });

  // ---------- Lightbox for phone screen galleries ----------
  const phoneGalleries = Array.from(document.querySelectorAll('.phone-scroll'))
    .map(scroll => Array.from(scroll.querySelectorAll('.phone-item img')))
    .filter(gallery => gallery.length);

  if (phoneGalleries.length){
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox__close" aria-label="Закрыть">✕</button>' +
      '<button class="lightbox__nav lightbox__prev" aria-label="Назад">‹</button>' +
      '<div class="lightbox__stage"><img class="lightbox__img" alt=""></div>' +
      '<button class="lightbox__nav lightbox__next" aria-label="Далее">›</button>' +
      '<div class="lightbox__counter"></div>';
    document.body.appendChild(overlay);

    const lbImg = overlay.querySelector('.lightbox__img');
    const lbCounter = overlay.querySelector('.lightbox__counter');
    const lbClose = overlay.querySelector('.lightbox__close');
    const lbPrev = overlay.querySelector('.lightbox__prev');
    const lbNext = overlay.querySelector('.lightbox__next');

    let gallery = [];
    let index = 0;

    function render(){
      const src = gallery[index];
      lbImg.src = src.getAttribute('src');
      lbImg.alt = src.getAttribute('alt') || '';
      const multi = gallery.length > 1;
      lbCounter.style.display = multi ? '' : 'none';
      lbPrev.style.display = multi ? '' : 'none';
      lbNext.style.display = multi ? '' : 'none';
      lbCounter.textContent = (index + 1) + ' / ' + gallery.length;
    }
    function openLightbox(g, i){
      gallery = g; index = i;
      render();
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    function prevSlide(){ index = (index - 1 + gallery.length) % gallery.length; render(); }
    function nextSlide(){ index = (index + 1) % gallery.length; render(); }

    phoneGalleries.forEach(g => {
      g.forEach((img, i) => {
        const item = img.closest('.phone-item');
        if (!item) return;
        item.style.cursor = 'zoom-in';
        item.addEventListener('click', () => openLightbox(g, i));
      });
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', prevSlide);
    lbNext.addEventListener('click', nextSlide);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'ArrowRight') nextSlide();
    });

    let touchStartX = null;
    overlay.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive:true });
    overlay.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) (dx > 0 ? prevSlide() : nextSlide());
      touchStartX = null;
    }, { passive:true });
  }

  // ---------- Whole-block click (teaser cards & showcases) ----------
  document.querySelectorAll('.teaser-card, .showcase').forEach(block => {
    const link = block.querySelector('a.btn-pill');
    if (!link) return;
    block.style.cursor = 'pointer';
    block.addEventListener('click', (e) => {
      if (e.target.closest('a')) return; // native link click
      if (link.target === '_blank') window.open(link.href, '_blank', 'noopener');
      else window.location.href = link.href;
    });
  });

  // ---------- i18n RU / EN ----------
  const dict = {
    // Hero
    'Привет!) Я продуктовый дизайнер, фокусируюсь на UX и системном подходе к процессам':
      "Hi!) I'm a product designer focused on UX and a systems approach to processes",
    'Сейчас делаю 💫 магию в RUTUBE': 'Currently making 💫 magic at RUTUBE',
    'Создаю дизайн от идеи до реализации': 'I craft design from idea to implementation',
    'Структурирую хаос в понятную систему': 'I structure chaos into a clear system',
    'Проектирую для людей приятно и просто': 'I design for people — pleasant and simple',
    'Соединяю удобство с целями бизнеса': 'I connect usability with business goals',
    // Design system case
    'Развиваю дизайн-систему RUTUBE, которая реально работает и масштабируется':
      'I grow the RUTUBE design system that really works and scales',
    'Живой продукт, которым пользуются дизайнеры и разработчики 5 стримов с понятной документацией, а также прозрачными процессами':
      'A living product used by designers and developers of 5 streams, with clear documentation and transparent processes',
    'в 3 раза': '3x faster',
    'Ускорили дизайнеров и разработку': 'Sped up designers and development',
    'Компонентов и гайдов': 'Components and guides',
    'Продуктов': 'Products',
    '3 платформы': '3 platforms',
    // Studio case
    'Запустили и развили инструмент по работе с контентом и его аналитики для блогеров':
      'Launched and grew a content management and analytics tool for creators',
    '100 тыс + скачиваний, 12 млн видео загрузили авторы. Обкатаны и настроены процессы выпуска и аналитики фичей':
      '100k+ downloads, 12M videos uploaded by creators. Release and feature analytics processes are battle-tested',
    '8 мин.': '8 min.',
    '4 тыс.': '4k',
    '15% в год': '15% per year',
    '20% в год': '20% per year',
    'Загружают видео в день': 'Videos uploaded daily',
    // Teasers
    'Как мы увеличили конверсию загрузки видео на 36%?': 'How we increased video upload conversion by 36%',
    'Как мы увеличили долю монетизируемых авторов?': 'How we increased the share of monetized creators',
    'Процесс + результат': 'Process + result',
    // Freelance
    'Создаю дизайн, запускаю сайты и сервисы для продуктов и услуг':
      'I design and launch websites and services for products',
    'Выстраиваю коммуникацию с заказчиками (от продажи до сдачи проекта), делаю дизайн, координировал команду разработки':
      'I run client communication (from sale to delivery), do the design, and coordinated the dev team',
    'Хакатон. Ничего не понять и почти дойти до финала': 'Hackathon. Understand nothing and almost reach the finals',
    'Гайд по участию + ретро': 'Participation guide + retro',
    // Case pages shared UI
    'Назад': 'Back',
    'Главная': 'Home',
    'Начало': 'Start',
    'Контекст': 'Context',
    'Проблема': 'Problem',
    'Процесс': 'Process',
    'Анализ': 'Analysis',
    'Решение': 'Solution',
    'Результат': 'Result',
    'Результаты': 'Results',
    'Исследование': 'Research',
    'Что внутри': "What's inside",
    'Гипотезы': 'Hypotheses',
    'Роль': 'Role',
    'Аудитория': 'Audience',
    'Что было сделано': 'What was done',
    'Определение проблемы': 'Problem definition',
    'Проектирование дизайна': 'Design work',
    'Сопровождение разработки': 'Development support',
    'Авторы-партнёры': 'Partner creators',
    'Разделы': 'Sections',
    'Студия': 'Studio',
    'Дизайн-система': 'Design system',
    'Монетизация': 'Monetization',
    'Видео': 'Video',
    'Мобильное приложение': 'Mobile app',
    '100+ компонентов': '100+ components',
    'Доход авторов': "Creators' income",
    'Плеер и стриминг': 'Player and streaming',
    'Обзор всех кейсов': 'All case studies',
    'Читать кейс': 'Read case study',
  };

  const originals = new Map();

  function normalize(s){
    return s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function applyLang(lang){
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    const nodes = [];
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(n => {
      const raw = n.nodeValue;
      const key = normalize(raw);
      if (!key) return;
      if (lang === 'en'){
        if (dict[key] !== undefined){
          if (!originals.has(n)) originals.set(n, raw);
          const lead = raw.match(/^\s*/)[0];
          const trail = raw.match(/\s*$/)[0];
          n.nodeValue = lead + dict[key] + trail;
        }
      } else {
        if (originals.has(n)) n.nodeValue = originals.get(n);
      }
    });
    document.querySelectorAll('.profile-card__lang button, .case-modal__lang button').forEach(b => {
      b.classList.toggle('active', (b.dataset.lang || b.textContent.trim().toLowerCase()) === lang);
    });
    try { localStorage.setItem('folio-lang', lang); } catch(e){}
    document.documentElement.lang = lang;
  }

  document.querySelectorAll('.profile-card__lang button, .case-modal__lang button').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (btn.dataset.lang || btn.textContent.trim().toLowerCase()) === 'en' ? 'en' : 'ru';
      document.body.classList.add('lang-switching');
      setTimeout(() => {
        applyLang(lang);
        document.body.classList.remove('lang-switching');
      }, 200);
    });
  });

  let saved = 'ru';
  try { saved = localStorage.getItem('folio-lang') || 'ru'; } catch(e){}
  if (saved === 'en') applyLang('en');
});
