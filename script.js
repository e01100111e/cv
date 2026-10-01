(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Theme ----------
  const themeToggle = document.querySelector('[data-theme-toggle]');
  themeToggle.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  themeToggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    themeToggle.setAttribute('aria-pressed', String(next === 'dark'));
    try { localStorage.setItem('theme', next); } catch (error) {}
  });

  // ---------- Scroll reveal ----------
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  // ---------- Stat counters ----------
  const formatCount = (value, decimals) =>
    value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const animateCount = (element) => {
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(target * eased, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!reduceMotion) {
    const countObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach((element) => countObserver.observe(element));
  }

  // ---------- Skill filter ----------
  const skillButtons = document.querySelectorAll('[data-skill]');
  const filterTargets = document.querySelectorAll('[data-skills]');
  const filterStatus = document.querySelector('[data-filter-status]');
  const gamesSection = document.getElementById('games');
  let activeSkill = '';

  const applyFilter = (skill, label) => {
    activeSkill = skill;
    const matches = { game: 0, role: 0 };
    const totals = { game: 0, role: 0 };
    filterTargets.forEach((target) => {
      const isMatch = !skill || target.dataset.skills.split(' ').includes(skill);
      target.classList.toggle('is-dimmed', !isMatch);
      totals[target.dataset.kind] += 1;
      if (isMatch) matches[target.dataset.kind] += 1;
    });
    skillButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.skill === skill));
    });
    filterStatus.textContent = skill
      ? `${label}: ${matches.game} of ${totals.game} games and ${matches.role} of ${totals.role} roles.`
      : '';
  };

  skillButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const skill = button.dataset.skill;
      // Clicking the active skill again clears the filter.
      const next = skill === activeSkill ? '' : skill;
      applyFilter(next, button.textContent.trim());
      if (next && button.hasAttribute('data-scroll')) {
        gamesSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // ---------- Role to game links ----------
  document.querySelectorAll('[data-highlight]').forEach((link) => {
    link.addEventListener('click', () => {
      const card = document.getElementById(link.dataset.highlight);
      card.classList.add('is-highlighted');
      setTimeout(() => card.classList.remove('is-highlighted'), 2200);
    });
  });

  // ---------- Card pointer spotlight ----------
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
      card.style.setProperty('--my', `${event.clientY - bounds.top}px`);
    });
  });

  // ---------- Timeline progress ----------
  const timeline = document.querySelector('[data-timeline]');
  let timelineFrame = 0;
  const updateTimeline = () => {
    timelineFrame = 0;
    const bounds = timeline.getBoundingClientRect();
    const anchor = window.innerHeight * 0.6;
    const progress = Math.min(Math.max((anchor - bounds.top) / bounds.height, 0), 1);
    timeline.style.setProperty('--progress', progress.toFixed(3));
  };
  if (reduceMotion) {
    timeline.style.setProperty('--progress', '1');
  } else {
    const requestTimelineUpdate = () => {
      if (!timelineFrame) timelineFrame = requestAnimationFrame(updateTimeline);
    };
    window.addEventListener('scroll', requestTimelineUpdate, { passive: true });
    window.addEventListener('resize', requestTimelineUpdate);
    updateTimeline();
  }

  // ---------- Active nav link ----------
  const navLinks = new Map();
  document.querySelectorAll('.nav-links a').forEach((link) => {
    navLinks.set(link.getAttribute('href').slice(1), link);
  });
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link, id) => link.classList.toggle('is-active', id === entry.target.id));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((link, id) => sectionObserver.observe(document.getElementById(id)));

  // ---------- Cover image fallback ----------
  document.querySelectorAll('img[data-fallback]').forEach((image) => {
    const showFallback = () => {
      image.parentElement.dataset.title = image.dataset.fallback;
      image.parentElement.classList.add('is-missing');
    };
    if (image.complete && image.naturalWidth === 0 && image.currentSrc) showFallback();
    else image.addEventListener('error', showFallback);
  });
})();
