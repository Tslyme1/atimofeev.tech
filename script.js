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
  document.querySelectorAll('.card-slider, .phone-scroll, .funnel, .info-row').forEach(el => {
    const maskTarget = el.closest('.shot-card') || el;
    // Read once (and on resize only) — calling getComputedStyle from inside a
    // scroll handler forces a synchronous style recalc every frame, which is
    // what caused the stutter during momentum scrolling.
    let maxFade = parseFloat(getComputedStyle(maskTarget).getPropertyValue('--fade-max')) || 0;
    let lastFade = null;
    let ticking = false;
    function apply(){
      ticking = false;
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
      const atEnd = remaining <= 2 || el.scrollWidth <= el.clientWidth;
      maskTarget.classList.toggle('at-end', atEnd);
      // Shrink the fade continuously as the end approaches instead of snapping the
      // mask on/off, so the right edge never jumps mid-scroll (esp. iOS momentum).
      const fade = Math.max(0, Math.min(maxFade, remaining));
      if (fade !== lastFade){
        lastFade = fade;
        maskTarget.style.setProperty('--fade', fade + 'px');
      }
    }
    function updateFade(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
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
    window.addEventListener('resize', () => {
      maxFade = parseFloat(getComputedStyle(maskTarget).getPropertyValue('--fade-max')) || 0;
      updateFade();
    });
    apply();
  });

  // ---------- Lightbox for phone screen galleries ----------
  const phoneGalleries = Array.from(document.querySelectorAll('.phone-scroll'))
    .map(scroll => Array.from(scroll.querySelectorAll('.phone-item img')))
    .filter(gallery => gallery.length);
  const showcaseImgs = Array.from(document.querySelectorAll('.showcase-img'));

  if (phoneGalleries.length || showcaseImgs.length){
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

    // Case preview images on the homepage (single-image galleries). Click
    // opens the zoom instead of the whole-card navigation link.
    showcaseImgs.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox([img], 0);
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
    // Studio case (extra)
    'Запустили': 'Launched',
    'Работаем': 'Workflow',
    'Мобильная студия': 'Mobile Studio',
    'Кейс': 'Case study',
    '100 тыс + скачиваний, 12 млн видео загрузили авторы.': '100k+ downloads, 12M videos uploaded by creators.',
    'Обкатаны и настроены процессы выпуска и аналитики фичей': 'Release and feature analytics processes are battle-tested',
    'Стратегия запуска': 'Launch strategy',
    'Синхронизация процессов': 'Process synchronization',
    'Дизайн приложения': 'App design',
    'О мобильной студии': 'About the mobile studio',
    'Это мобильное приложение для авторов контента, которое позволяет управлять своим каналом. Пользователи могут загружать видео, проводить прямые эфиры, анализировать статистику канала и взаимодействовать с аудиторией': 'A mobile app for content creators that lets them manage their channel. Users can upload videos, go live, analyze channel stats, and engage with their audience',
    'Бизнес модель Rutube': 'RUTUBE business model',
    'и где мы в ней находимся': 'and where we fit into it',
    'Авторы загружают контент и получают выплаты за счёт его просмотра зрителями, которые платят за подписку/смотрят рекламу': 'Creators upload content and get paid based on views from viewers who pay for a subscription or watch ads',
    'Мы отвечаем за мобильное направление': 'We own the mobile direction',
    'Проблема на старте — нет видения продукта: мы проводим исследования, выявляем ключевые потребности на основе частоты запросов и сегментирования': 'The problem at the start — no product vision: we run research and identify key needs based on request frequency and segmentation',
    'Сформировали стратегию развития': 'Formed a development strategy',
    'Провели исследования (Интервью с авторами Rutube/YouTube), выявили основные потребности и сформировали основной список функций для MVP и дальнейших версий продукта': 'Ran research (interviews with RUTUBE/YouTube creators), identified core needs, and shaped the core feature list for the MVP and later versions',
    'Спланировали разработку функций по кварталам': 'Planned feature development by quarter',
    'Опубликованное видео': 'Published video',
    'Базовая аналитика': 'Basic analytics',
    'Ответы на комментарии': 'Replying to comments',
    'Загрузка / Редактирование видео': 'Video upload / editing',
    'Аналитика по видео': 'Video analytics',
    'Создание трансляций': 'Creating live streams',
    'Управление контентом': 'Content management',
    'Расширенная аналитика': 'Advanced analytics',
    'Профиль': 'Profile',
    'Ускорили процесс разработки и поддержки фичей': 'Sped up the process of developing and maintaining features',
    'Благодаря синхронизации дизайна и разработки, структурирования сценариев, создания UI kit и интеграции его в разработку': 'Thanks to syncing design and development, structuring scenarios, building a UI kit, and integrating it into development',
    'Мобильная студия сегодня': 'Mobile Studio today',
    'или как мы работаем': 'or how we work',
    'Идея': 'Idea',
    'Синхронизируемся с продуктовыми приоритетами и исследованиями, обсуждаем нужные функции и формируем план на квартал с оценкой влияния на метрики': 'We sync with product priorities and research, discuss the features we need, and set a quarterly plan with an estimated impact on metrics',
    'Макет': 'Design',
    'Обсуждаем задачу и сценарии, создаём и прорабатываем макеты в папке Draft, синхронизируемся с командой, готовим всё к разработке и проводим груминг с оценкой сроков': 'We discuss the task and scenarios, create and refine designs in the Draft folder, sync with the team, prep everything for development, and run grooming with time estimates',
    'Разработка': 'Development',
    'Переносим макеты в папку Dev, разработчики реализуют фичу с возможными правками макетов, после чего проводим дизайн-ревью': 'We move designs to the Dev folder, developers implement the feature with possible design tweaks, then we run a design review',
    'Прод': 'Production',
    'Выпускаем фичу в прод и стор, дублируем макеты в Prod-файл, фиксируем релиз в Changelog, переносим макеты в Archive и следим за метриками с формированием новых гипотез': 'We ship the feature to production and the store, duplicate the designs into the Prod file, log the release in the Changelog, move the designs to Archive, and track metrics to shape new hypotheses',
    'На старте — хаос в процессах. Все фичи делались в одних макетах, не было единого источника правды, часть фич прорабатывалась без задач, в похожих местах — разное отображение элементов, обособленность команды от основного продукта': 'At the start — chaos in the process. All features were designed in the same files, there was no single source of truth, some features were built without proper tasks, similar elements looked different in different places, and the team was disconnected from the core product',
    'За время работы настроили комфортный и прозрачный для всех участников команды процесс работы, навели порядок в макетах, подружились с вертикалью веба для синхронизации опыта авторов': 'Over time we set up a comfortable, transparent process for the whole team, brought order to the designs, and aligned with the web vertical to sync the creator experience',
    '↗ 15% в год': '↗ 15% per year',
    '↗ 20% в год': '↗ 20% per year',
    // Monetization case (extra)
    'Как мы увеличили долю монетизируемых авторов внутри мобильной студии': 'How we increased the share of monetized creators within the mobile studio',
    'Монетизация — один из ключевых драйверов удержания авторов на платформе: чем больше авторов зарабатывает на контенте, тем выше их мотивация загружать видео, а значит — растёт вотчтайм и рекламная выручка RUTUBE': 'Monetization is one of the key drivers of creator retention on the platform: the more creators earn from content, the more motivated they are to upload videos — which grows watch time and RUTUBE\'s ad revenue',
    'Бизнес-цель — увеличить эту долю, не снижая качество одобряемых заявок': 'Business goal — grow that share without lowering the quality of approved applications',
    'Авторы не понимали:': 'Creators didn\'t understand:',
    'Может ли их контент монетизироваться': 'Whether their content could be monetized',
    'Как стать монетизируемым': 'How to become monetized',
    'Какие требования предъявляются к заявке': 'What requirements applied to the application',
    'Происходили регулярные обращения в поддержку в месяц по теме монетизации, заявки отклонялось из-за несоответствия требованиям': 'There were regular support requests about monetization each month, and applications were rejected for not meeting the requirements',
    'Появилась гипотеза: если сделать путь «условия → заявка → одобрение» прозрачным внутри интерфейса, вырастет доля авторов, которые доходят до одобренной заявки, и снизится нагрузка на поддержку': 'A hypothesis emerged: making the “conditions → application → approval” path transparent in the interface would grow the share of creators reaching an approved application and reduce the support load',
    'Разбили путь автора на три этапа:': 'We split the creator\'s path into three stages:',
    'Выполнение условий → Подача заявки → Одобрение заявки': 'Meeting conditions → Submitting an application → Application approval',
    'Сформулировали продуктовую цель: максимизировать долю авторов, которые выполнили условия и подали заявку, которая не будет отклонена (то есть оптимизировали не просто «подачу», а «подачу качественную» — иначе выросла бы нагрузка на модерацию без роста реальных партнёров)': 'We set a product goal: maximize the share of creators who meet the conditions and submit an application that won\'t be rejected (i.e. optimize not just for “submitting” but for “submitting well” — otherwise moderation load would grow without a real increase in partners)',
    'На этапе исследования:': 'During research:',
    'Подняли аналитику по текущей воронке, чтобы найти, на каком шаге теряются авторы': 'Pulled analytics on the current funnel to find where creators drop off',
    'Прогнали тикеты поддержки по теме монетизации и сгруппировали по типам непонимания (не знают об условиях / не понимают, что не так с заявкой / не знают, что заявка вообще существует)': 'Went through monetization-related support tickets and grouped them by type of confusion (unaware of the conditions / don\'t understand what\'s wrong with the application / don\'t know the application exists)',
    'Синхронизировались с командой модерации/комплаенса, чтобы понять, какие причины отказов самые частые — это стало входом для формулировки требований внутри формы': 'Synced with the moderation/compliance team to understand the most common rejection reasons — this fed directly into the requirements inside the form',
    'Смотрели продукты с похожей механикой «условия → пошаговая заявка на монетизацию»': 'Looked at products with a similar “conditions → step-by-step monetization application” mechanic',
    'Что взяли:': 'What we took away:',
    'Явное отображение прогресса выполнения условий до подачи заявки (а не после)': 'Explicit progress on meeting conditions before submitting the application (not after)',
    'Пошаговую форму вместо одной длинной страницы — снижает когнитивную нагрузку и позволяет валидировать каждый шаг отдельно': 'A step-by-step form instead of one long page — reduces cognitive load and lets each step be validated separately',
    'Ключевой инсайт: во вью-версии (старая реализация, где условия и форма подачи заявки были представлены как статичная страница/веб-вью) конверсия проседала — очень небольшой процент авторов, выполнивших условия, доходили до подачи заявки. Основная точка потери — частичное заполнение заявки и невозможность возврата к определённому этапу': 'Key insight: in the webview version (the old implementation, where conditions and the application form were a static page/webview), conversion dropped sharply — very few creators who met the conditions made it to submitting an application. The main drop-off point was partial form completion with no way to return to a given step',
    'Из анализа воронки и паттернов конкурентов сформулировали два решения:': 'From the funnel analysis and competitor patterns, we formulated two solutions:',
    'Виджет прогресса выполнения условий — закрывает проблему «не понимаю, что уже сделано и что осталось». Автор в любой момент видит статус по каждому условию монетизации': 'A conditions-progress widget — solves “I don\'t understand what\'s done and what\'s left.” Creators can see the status of every monetization condition at any time',
    'Пошаговая нативная форма заявки вместо статичного вью — закрывает проблему «форма выглядит длинной/непонятной», и позволяет валидировать данные на каждом шаге, а не после отправки всей заявки — за счёт этого снижается доля отклонённых заявок': 'A step-by-step native application form instead of a static webview — solves “the form feels long/confusing,” and lets data be validated at every step instead of after the full submission — which lowers the rejected-application rate',
    'Перед релизом протестировали прототип на авторах, чтобы убедиться, что пошаговая форма не увеличивает время прохождения и не роняет completion rate': 'Before release we tested the prototype with creators to make sure the step-by-step form didn\'t increase completion time or hurt the completion rate',
    'Геймификация': 'Gamification',
    'Виджет заявки': 'Application widget',
    'Пошаговая форма': 'Step-by-step form',
    'Вовлечение в заполнение': 'Completion engagement',
    'По данным аналитики в МСБ самая высокая доля партнёров': 'According to analytics, SMB has the highest share of partners',
    'Партнёры — самая целевая аудитория авторов, поскольку они больше всего заинтересованы в загрузке контента → это напрямую увеличивает вотчтайм платформы → RUTUBE зарабатывает больше на рекламе': 'Partners are the most valuable creator audience, since they\'re the most motivated to upload content → which directly increases platform watch time → RUTUBE earns more on ads',
    'Запустили и развили мобильную студию для авторов': 'Launched and grew the mobile studio for creators',
    // Video case (extra)
    'Загрузка видео': 'Video upload',
    'Реализованная MVP версия сценария загрузки негативно влияла на метрики. Дёшево и сердито, была цель сделать максимально быстро и просто': 'The shipped MVP version of the upload scenario hurt the metrics. Cheap and cheerful — the goal was to ship it as fast and simply as possible',
    'MVP Загрузка видео': 'MVP Video upload',
    'Экран загрузки': 'Upload screen',
    'Выбор категории': 'Category selection',
    'Видео загружается': 'Video is uploading',
    'MVP Воронка сценария': 'MVP Scenario funnel',
    'Посмотрели на текущую воронку взаимодействия со сценарием и выявили слабые места, а также зону нашего влияния': 'Looked at the current interaction funnel for the scenario and identified weak points, and where we could make an impact',
    'Упростить заполнение полей': 'Simplify field entry',
    'Сформулировали гипотезы, которые могут сделать сценарий удобнее и увеличить метрики, оценили их по RICE для внедрения в приложение': 'Formulated hypotheses that could make the scenario more convenient and improve metrics, scored them with RICE to decide what to build into the app',
    'Определять название видео по содержанию': 'Auto-detect the video title from its content',
    'Может не всегда корректно определять, сложно, бек не поддерживает': 'May not always detect correctly, complex, backend doesn\'t support it',
    'Автоматическое определение категории': 'Automatic category detection',
    'Идеально для пользователя, но бек не поддерживает': 'Ideal for the user, but backend doesn\'t support it',
    'Автоматическое заполнение названия': 'Auto-fill the title',
    'Несложно сделать, пользователь поправит позже': 'Easy to build, user can fix it later',
    'Настройка предвыбора категории': 'Configurable default category',
    'Придётся каждый раз перенастраивать, неудобно и долго': 'Would need reconfiguring every time — inconvenient and slow',
    'Выводить сверху наиболее часто выбираемые категории': 'Show the most-picked categories at the top',
    'Сложная логика, для некоторых юзеров может не сработать': 'Complex logic, might not work for some users',
    'Добавить поиск': 'Add search',
    'Быстро реализовывать, покрывает все кейсы': 'Fast to build, covers all cases',
    'Расширить область взаимодействия со списком категорий': 'Expand the tap area for the category list',
    'Быстро реализовать и протестировать': 'Fast to build and test',
    'Починить приложение': 'Fix the app',
    'Снек с просьбой не выходить из прилы': 'Snackbar asking not to leave the app',
    'Могут не увидеть, быстро делать': 'Might be missed, fast to build',
    'Фоновая загрузка': 'Background upload',
    'Делать дольше, но покроем все кейсы': 'Takes longer to build, but covers all cases',
    'Алерт с просьбой не выходить': 'Alert asking not to leave',
    'Будет напрягать пользователей, быстро делать': 'Will annoy users, fast to build',
    'Работы над функцией загрузки видео': 'Work on the video upload feature',
    'Ввод названия': 'Title entry',
    'Выбирает категорию': 'Picks a category',
    'Нажатие на «Опубликовать»': 'Taps “Publish”',
    'Видео успешно опубликовано': 'Video published successfully',
    // Design system case (extra)
    'Обзор': 'Overview',
    'Что изменилось': 'What changed',
    'Создание компонентов и гайдов': 'Building components and guides',
    'Внедрение на Web, Mobile, TV': 'Rollout on Web, Mobile, TV',
    'Команды дизайна и разработки': 'Design and development teams',
    'DS Rutube год назад': 'RUTUBE DS a year ago',
    'Начинала своё зарождение и была похожа на непроработанный UI-кит без документации, с одним перегруженным файлом на все продукты и хаотичными процессами': 'Just getting started, and looked more like a rough UI kit with no docs — one overloaded file for every product and chaotic processes',
    'DS Rutube сегодня': 'RUTUBE DS today',
    'Это живой продукт, которым пользуются дизайнеры и разработчики 5 стримов с понятной документацией, шаблонами задач, разделёнными файлами, а также прозрачными процессами': 'A living product used by designers and developers across 5 streams, with clear docs, task templates, split files, and transparent processes',
    'Большое количество вопросов по компонентам': 'A lot of questions about components',
    'Дизайнеры и разработчики регулярно задавали одинаковые вопросы о состояниях компонентов, допустимых вариантах и правилах использования. Некоторые решения существовали только в макетах или устных договорённостях': 'Designers and developers kept asking the same questions about component states, valid variants, and usage rules. Some decisions only existed in designs or verbal agreements',
    'Разработали подробные гайды и внедрили митапы': 'Built detailed guides and introduced meetups',
    'Появился единый источник правды для дизайнеров и разработчиков, снизилось количество повторяющихся вопросов, а также ускорился процесс принятия интерфейсных решений': 'A single source of truth appeared for designers and developers, repeat questions dropped, and interface decisions got made faster',
    'Нет прозрачного процесса развития дизайн-системы': 'No transparent process for evolving the design system',
    'Команды не понимали, как предложить доработку компонентов или инициировать изменения, как правильно заводить задачи. Не всегда знали об обновлениях компонентов': 'Teams didn\'t know how to propose component improvements or trigger changes, or how to file tasks correctly. They weren\'t always aware of component updates',
    'Уменьшили хаос в задачах и процессе работы команды': 'Reduced the chaos in tasks and team workflow',
    'Ввели процесс создания задач на улучшение дизайн-системы с последующей валидацией и планированием в backlog, создали отдельный телеграм канал с публикациями обновлений, сделали упрощенный и более информативный Changelog, а также понятный нейминг и нумерацию веток': 'Introduced a process for filing design-system improvement tasks with validation and backlog planning, created a separate Telegram channel for update posts, made a simpler and more informative Changelog, and clear branch naming and numbering',
    'Неудобно пользоваться библиотекой': 'The library was inconvenient to use',
    'Непонятная навигация по компонентам, как продуктовым, так и из дизайн системы. 1 файл для всех продуктов': 'Confusing navigation across components, both product and design-system ones. One file for every product',
    'Улучшили взаимодействие с компонентами': 'Improved how teams interact with components',
    '1 файл с компонентами - 1 стрим, упростили навигацию, команде стало проще ориентироваться по базовым и продуктовым компонентам. Памяти достаточно, ветки спокойно вливаются': 'One component file per stream — simplified navigation, making it easier for teams to find both base and product components. Enough memory, branches merge smoothly',
    'Масштабирование дизайн системы, строим роадмап по компонентам и макетам, готовим токены': 'Scaling the design system — building a roadmap for components and designs, preparing tokens',
    'Как мы работаем': 'How we work',
    'Процесс работы над дизайн системой': 'Our process for working on the design system',
    'Находим кейсы': 'Find cases',
    'Смотрим на входящие задачи и макеты продуктовых дизайнеров': 'Look at incoming tasks and product designers\' designs',
    'Проверяем покрытие': 'Check coverage',
    'Стоит ли заводить это как компонент дс или оставить его продуктовым': 'Decide whether to make it a DS component or leave it product-specific',
    'Думаем над решением': 'Think through the solution',
    'Обсуждаем и оцениваем требования к компоненту по сложности/срокам': 'Discuss and estimate the component requirements by complexity/timeline',
    'Драфт компонента': 'Component draft',
    'Создаем ветку с первичной структурой и гайдом компонента': 'Create a branch with the initial structure and guide for the component',
    'Брейншторм': 'Brainstorm',
    'Обсуждаем с разработкой нюансы и технические ограничения': 'Discuss nuances and technical constraints with development',
    'Релиз': 'Release',
    'Публикуем компонент и новость о его создании/изменении': 'Publish the component and an update about its creation/change',
    'Ревью и анализ': 'Review and analysis',
    'Смотрим на корректность использования компонента': 'Check that the component is being used correctly',
    'Работы над дизайн системой': 'Work on the design system',
    'Интерфейс на дизайн системе': 'Interface built on the design system',
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
    document.querySelectorAll('img[data-en-src]').forEach(img => {
      if (lang === 'en'){
        if (!img.dataset.ruSrc) img.dataset.ruSrc = img.getAttribute('src');
        img.src = img.dataset.enSrc;
      } else if (img.dataset.ruSrc){
        img.src = img.dataset.ruSrc;
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
      closeProfile();
      closeCaseModal();
    });
  });

  let saved = 'ru';
  try { saved = localStorage.getItem('folio-lang') || 'ru'; } catch(e){}
  if (saved === 'en') applyLang('en');
});
