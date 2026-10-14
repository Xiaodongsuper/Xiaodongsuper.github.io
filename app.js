/* All public content is read from data.json. No account or browser draft required. */
(() => {
  'use strict';
  let data;
  let source;
  let locale = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
  let sectionObserver;
  const ui = (zh, en) => locale === 'en' ? en : zh;
  let view = 'selected';
  const $ = (id) => document.getElementById(id);
  const label = (key, fallback) => data.labels?.[key] || fallback;
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;
      if (key === 'class') node.className = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat(Infinity)) {
      if (child !== null && child !== undefined) node.append(child instanceof Node ? child : String(child));
    }
    return node;
  }
  function safeURL(value, image = false) {
    if (!value || typeof value !== 'string') return null;
    try {
      const url = new URL(value, location.href);
      return (image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:']).includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  function link(item, className = '') {
    const href = safeURL(item.url);
    if (!href) return null;
    const external = new URL(href).origin !== location.origin && !href.startsWith('mailto:');
    return el('a', { href, class: className, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, item.label);
  }
  function section(id, title, ...children) {
    return el('section', { id, 'aria-labelledby': `${id}-heading` },
      el('h2', { id: `${id}-heading` }, title), ...children);
  }
  function profileIcon(href) {
    if (isGitHub(href)) return githubIcon();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '16', height: '16', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(key, value);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (new URL(href).hostname === 'scholar.google.com') {
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('d', 'M12 0 0 9.75l4.91 4A7.5 7.5 0 0 1 12 9a7.5 7.5 0 0 1 7.09 4.75L24 9.75 12 0Zm0 10.5a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Z');
    } else {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.7');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', href.startsWith('mailto:') ? 'M3 5h18v14H3V5Zm0 1 9 7 9-7' : 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2');
    }
    svg.append(path);
    return svg;
  }
  function setLanguage(next) {
    locale = next;
    const translation = source.translations?.[locale] || {};
    data = { ...source, ...translation, labels: { ...source.labels, ...translation.labels } };
    const url = new URL(location.href);
    url.searchParams.set('lang', locale);
    history.replaceState(null, '', url);
    render();
  }
  function languageSwitch() {
    const group = el('div', { class: 'language-switch', role: 'group', 'aria-label': 'Language / 语言' });
    for (const [code, text] of [['zh', '中文'], ['en', 'English']]) {
      const button = el('button', { type: 'button', lang: code === 'zh' ? 'zh-CN' : 'en', 'aria-pressed': String(locale === code), 'data-lang': code }, text);
      button.addEventListener('click', () => {
        setLanguage(code);
        document.querySelector(`[data-lang="${code}"]`)?.focus({ preventScroll: true });
      });
      group.append(button);
    }
    return group;
  }
  function renderProfile() {
    const avatar = safeURL(data.avatar, true);
    $('sidebar').replaceChildren(
      el('div', { class: 'profile-inner' },
        avatar ? el('img', { class: 'avatar', src: avatar, alt: ui(`${data.name}的照片`, `Portrait of ${data.name}`), width: 144, height: 144 }) : null,
        el('div', { class: 'identity' },
          el('h1', {}, data.name),
          data.nameZh ? el('p', { class: 'english-name', lang: locale === 'en' ? 'zh-CN' : 'en' }, data.nameZh) : null,
          el('p', { class: 'role' }, data.title),
          el('p', { class: 'affiliation' }, data.affiliation)),
        el('div', { class: 'profile-details' },
          el('ul', { class: 'profile-links' }, (data.links || []).map((item) => {
            const a = link(item, 'profile-link');
            if (!a) return null;
            a.replaceChildren(profileIcon(a.href), el('span', {}, item.label));
            return el('li', {}, a);
          })),
          data.address ? el('p', { class: 'address' }, data.address) : null,
          data.recruit && source.showRecruit !== false ? el('a', { class: 'openings-link', href: '#recruit' }, el('span', { class: 'status-dot', 'aria-hidden': 'true' }), label('recruit', '实习与招生'), el('span', { 'aria-hidden': 'true' }, ' →')) : null)));
  }
  function datedList(key, fallback, { limit = 0, wide = false } = {}) {
    const items = data[key] || [];
    if (!items.length) return null;
    const list = (rows) => el('ul', { class: `dated${wide ? ' wide' : ''}` }, rows.map((item) =>
      el('li', {}, el('span', { class: 'date' }, item.date), el('span', {}, item.text))));
    return section(key, label(key, fallback), list(limit ? items.slice(0, limit) : items),
      limit && items.length > limit ? el('details', { class: 'archive' },
        el('summary', {}, ui(`更早动态（${items.length - limit}）`, `Earlier news (${items.length - limit})`)), list(items.slice(limit))) : null);
  }
  function authors(value = '') {
    const node = el('p', { class: 'authors' });
    const me = (data.highlightName || '').trim();
    if (!me) { node.textContent = value; return node; }
    const regex = new RegExp(`(?<![\\w])${me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`, 'g');
    let last = 0;
    for (const match of value.matchAll(regex)) {
      node.append(value.slice(last, match.index), el('strong', {}, match[0]));
      last = match.index + match[0].length;
    }
    node.append(value.slice(last));
    return node;
  }
  function paperYear(paper) {
    const explicit = String(paper.year || '');
    if (/^(19|20)\d{2}$/.test(explicit)) return explicit;
    return paper.venue?.match(/\b(?:19|20)\d{2}\b/)?.[0] || '其他 / 预印本';
  }
  function githubIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M12 .75a11.25 11.25 0 0 0-3.558 21.923c.563.104.768-.244.768-.542 0-.267-.01-.975-.015-1.914-3.13.68-3.79-1.508-3.79-1.508-.512-1.3-1.25-1.646-1.25-1.646-1.022-.699.077-.685.077-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.723 2.637 1.225 3.28.937.102-.728.393-1.225.715-1.507-2.498-.284-5.124-1.249-5.124-5.563 0-1.23.44-2.234 1.16-3.022-.116-.284-.503-1.428.11-2.978 0 0 .945-.303 3.094 1.155A10.785 10.785 0 0 1 12 6.192c.956.005 1.918.13 2.817.379 2.147-1.458 3.09-1.155 3.09-1.155.615 1.55.228 2.694.112 2.978.722.788 1.158 1.792 1.158 3.022 0 4.325-2.63 5.276-5.135 5.554.404.35.764 1.042.764 2.1 0 1.515-.014 2.737-.014 3.11 0 .3.203.65.774.54A11.25 11.25 0 0 0 12 .75Z');
    svg.append(path);
    return svg;
  }
  function isGitHub(url) {
    try { return new URL(url).hostname === 'github.com'; } catch { return false; }
  }
  function pdfIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '16', height: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(key, value);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8l-6-6Z M14 2v6h6 M8 13h8 M8 17h6');
    svg.append(path);
    return svg;
  }
  function paperLinks(paper) {
    const items = [...(paper.links || [])];
    const pdf = safeURL(paper.pdf);
    if (pdf && !items.some((item) => safeURL(item.url) === pdf)) items.push({ label: 'PDF', url: pdf });
    const code = safeURL(paper.code);
    if (code && !items.some((item) => safeURL(item.url) === code)) items.push({ label: 'Code', url: code });
    return items.map((item) => {
      const anchor = link(item, 'paper-link');
      if (!anchor) return null;
      if (/^pdf$/i.test(item.label) || /\.pdf(?:[?#]|$)/i.test(anchor.href) || /^https:\/\/arxiv\.org\/pdf\//.test(anchor.href)) {
        anchor.classList.add('pdf-link');
        anchor.setAttribute('aria-label', `${paper.title} — ${ui('PDF 全文', 'Full-text PDF')}`);
        anchor.setAttribute('title', ui('打开论文 PDF', 'Open paper PDF'));
        anchor.replaceChildren(pdfIcon(), el('span', {}, 'PDF'));
      } else if (isGitHub(anchor.href)) {
        anchor.classList.add('code-link');
        anchor.setAttribute('aria-label', `${paper.title} — ${ui('GitHub 代码', 'GitHub code')}`);
        anchor.setAttribute('title', ui('在 GitHub 查看代码', 'View code on GitHub'));
        anchor.replaceChildren(githubIcon(), el('span', {}, 'Code'));
      }
      return anchor;
    });
  }
  function paperItem(paper) {
    const image = safeURL(paper.image, true);
    return el('article', { class: `paper${image ? ' has-image' : ''}` },
      image ? el('img', { src: image, alt: paper.title, loading: 'lazy', class: 'paper-image' }) : null,
      el('div', { class: 'paper-body' },
        el('h4', { class: 'paper-title', lang: 'en' }, paper.title),
        authors(paper.authors),
        el('div', { class: 'paper-meta' }, el('span', { class: 'venue' }, paper.venue),
          paper.ccf ? el('span', { class: 'classification' }, paper.ccf) : null,
          paperLinks(paper))));
  }
  function renderPapers() {
    const all = (data.publications || []).filter((paper) => paperYear(paper) !== '其他 / 预印本');
    const selected = all.filter((paper) => paper.selected);
    if (!selected.length) view = 'all';
    const tabs = $('paper-tabs');
    tabs.replaceChildren(...[['selected', label('selected', '代表作'), selected.length], ['all', label('all', '全部'), all.length]]
      .filter(([key]) => key !== 'selected' || selected.length)
      .map(([key, text, count]) => {
        const button = el('button', { type: 'button', class: view === key ? 'active' : '', 'aria-pressed': String(view === key), 'aria-controls': 'paper-list' }, text, el('span', { class: 'count' }, count));
        button.addEventListener('click', () => {
          view = key;
          renderPapers();
          [...tabs.children].find((item) => item.getAttribute('aria-pressed') === 'true')?.focus({ preventScroll: true });
        });
        return button;
      }));
    const papers = view === 'selected' ? selected : all;
    const groups = new Map();
    papers.forEach((paper) => {
      const year = paperYear(paper);
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(paper);
    });
    const years = [...groups.keys()].sort((a, b) => (Number(b) || 9999) - (Number(a) || 9999));
    $('paper-list').replaceChildren(...years.map((year) =>
      el('div', { class: 'paper-year' }, el('h3', {}, year), el('div', { class: 'year-papers' }, groups.get(year).map(paperItem)))));
    $('paper-status').textContent = ui(`显示 ${papers.length} 篇论文`, `Showing ${papers.length} publications`);
  }
  function recruit() {
    if (!data.recruit || source.showRecruit === false) return null;
    return section('recruit', label('recruit', '实习与招生'),
      el('p', { class: 'recruit-intro' }, data.recruit.intro),
      el('div', { class: 'recruit-grid' }, (data.recruit.groups || []).map((group) =>
        el('div', {}, el('h3', {}, group.title), el('ul', {}, (group.items || []).map((text) => el('li', {}, text)))))));
  }
  function render() {
    document.documentElement.lang = data.lang || 'zh-CN';
    document.title = [data.name, data.nameZh].filter(Boolean).join(' · ') + ui(' | 学术主页', ' | Academic Homepage');
    document.querySelector('meta[name="description"]').content = data.about || `${data.name}的学术主页`;
    document.querySelector('.skip-link').textContent = ui('跳转到正文', 'Skip to content');
    $('sidebar').setAttribute('aria-label', ui('个人信息', 'Profile'));
    $('nav').setAttribute('aria-label', ui('页面导航', 'Main navigation'));
    $('visitor-globe')?.setAttribute('aria-label', ui('访客地图', 'Visitor map'));
    renderProfile();
    $('content').replaceChildren(...[
      section('about', label('about', '个人简介'), el('p', { class: 'about-text' }, data.about),
        el('div', { class: 'interests' }, el('h3', {}, label('interests', '研究方向')),
          el('ul', {}, (data.interests || []).map((text) => el('li', {}, text))))),
      datedList('news', '最新动态', { limit: 4 }),
      (data.publications || []).length ? el('section', { id: 'publications', 'aria-labelledby': 'publications-heading' },
        el('div', { class: 'section-heading' }, el('h2', { id: 'publications-heading' }, label('publications', '学术论文')),
          el('div', { id: 'paper-tabs', class: 'paper-tabs', role: 'group', 'aria-label': ui('论文范围', 'Publication filter') })),
        el('p', { id: 'paper-status', class: 'sr-only', role: 'status' }), el('div', { id: 'paper-list' })) : null,
      recruit(), datedList('grants', '科研项目', { wide: true }), datedList('honors', '荣誉奖励'),
      datedList('service', '学术服务'), datedList('education', '教育经历'),
      (data.projects || []).length ? section('projects', label('projects', '开源项目'),
        el('div', { class: 'projects' }, data.projects.map((project) => el('article', {},
          el('h3', {}, link({ label: project.title, url: project.url }) || project.title), el('p', {}, project.desc))))) : null].filter(Boolean));
    if ($('paper-tabs')) renderPapers();
    const ids = ['about', 'news', 'publications', 'honors', 'service', 'recruit', 'grants'];
    $('nav').replaceChildren(
      el('div', { class: 'nav-top' }, el('a', { class: 'home-link', href: '#sidebar' }, ui('个人主页', 'Homepage')), languageSwitch()),
      el('ul', {}, ids.filter((id) => $(id)).map((id) =>
        el('li', {}, el('a', { href: `#${id}`, 'data-section': id }, $(id).querySelector('h2').textContent)))));
    $('footer').replaceChildren(el('span', {}, data.footer || ''), el('a', { href: '#sidebar' }, ui('回到顶部 ↑', 'Back to top ↑')));
    sectionObserver?.disconnect();
    if ('IntersectionObserver' in window) {
      sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        const id = visible[0].target.id;
        $('nav').querySelectorAll('a').forEach((a) => {
          if (a.dataset.section === id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-12% 0px -60% 0px' });
      ids.filter((id) => $(id)).forEach((id) => sectionObserver.observe($(id)));
    }
  }
  fetch('data.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((json) => { source = json; setLanguage(locale); })
    .catch((error) => {
      $('content').replaceChildren(el('div', { class: 'load-error', role: 'alert' },
        el('h1', {}, ui('主页内容暂时无法加载', 'Unable to load homepage')),
        el('p', {}, ui('请检查 data.json 的格式，并通过本地 HTTP 服务或网站地址访问。', 'Check the format of data.json and open this page through an HTTP server.')),
        el('p', {}, error.message)));
    });
})();
