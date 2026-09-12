/* ===== FFFabulous 官网全局脚本(数据驱动渲染)===== */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + " -> " + r.status);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + " -> " + r.status);
  return r.text();
}

/* --- 简易 CSV 解析(支持引号内逗号)--- */
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  const head = rows.shift() || [];
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || "").trim()])));
}

/* --- 极简 Markdown 渲染 --- */
function renderMD(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  // 正文首个一级标题与页面标题重复,跳过
  const firstContent = lines.findIndex((l) => l.trim() !== "");
  if (firstContent >= 0 && /^#\s+/.test(lines[firstContent].trim())) lines.splice(firstContent, 1);
  let html = "", inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  const inline = (s) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => src === "placeholder" ? "" : `<img src="${esc(src)}" alt="${esc(alt)}">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^-\s+/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += "<li>" + inline(line.replace(/^-\s+/, "")) + "</li>";
    } else { closeList(); }
    if (/^###\s+/.test(line)) html += "<h3>" + inline(line.slice(4)) + "</h3>";
    else if (/^##\s+/.test(line)) html += "<h2>" + inline(line.slice(3)) + "</h2>";
    else if (/^#\s+/.test(line)) html += "<h2>" + inline(line.slice(2)) + "</h2>";
    else if (/^>\s?/.test(line)) html += "<blockquote>" + inline(line.replace(/^>\s?/, "")) + "</blockquote>";
    else if (/^\*[^*]+\*$/.test(line.trim())) html += "<p><em>" + inline(line.trim().slice(1, -1)) + "</em></p>";
    else if (!inList && line.trim() !== "" && !/^#|^>\s?|^-\s+/.test(line)) html += "<p>" + inline(line) + "</p>";
  }
  closeList();
  return html;
}

/* --- 全局框架:导航 + 页脚 --- */
const NAV = [
  { key: "index", label: "首页", href: "index.html" },
  { key: "about-group", label: "关于", children: [
    { key: "about", label: "关于我们", href: "about.html" },
    { key: "history", label: "历程与传承", href: "history.html" },
    { key: "gallery", label: "照片图集", href: "gallery.html" },
  ]},
  { key: "news", label: "新闻动态", href: "news.html" },
  { key: "honors", label: "荣誉墙", href: "honors.html" },
  { key: "robots", label: "机器人", href: "robots.html" },
  { key: "newbie", label: "新人专区", href: "newbie.html" },
];

function renderHeader(site) {
  const page = document.body.dataset.page || "";
  const li = (item) => {
    if (item.children) {
      const inGroup = item.children.some((c) => c.key === page);
      return `<li class="${inGroup ? "active" : ""}">
        <a href="${item.children[0].href}">${item.label} ▾</a>
        <div class="dropdown">${item.children.map((c) => `<a href="${c.href}">${c.label}</a>`).join("")}</div>
      </li>`;
    }
    return `<li class="${item.key === page ? "active" : ""}"><a href="${item.href}">${item.label}</a></li>`;
  };
  $("#site-header").innerHTML = `
    <div class="site-header" id="topbar">
      <div class="container nav-inner">
        <a class="brand" href="index.html">
          <img src="assets/img/logo.jpg" alt="${esc(site.clubName)} 队徽">
          <span><span class="b-name">${esc(site.clubName)}</span><br><span class="b-en">${esc(site.teamCode)}</span></span>
        </a>
        <ul class="nav-menu" id="navMenu">${NAV.map(li).join("")}</ul>
        <button class="nav-toggle" id="navToggle" aria-label="菜单">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>`;
  $("#navToggle").addEventListener("click", () => $("#navMenu").classList.toggle("open"));
  window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 8));
  if (site.icp) {
    $("#site-header").insertAdjacentHTML("afterend", "");
  }
}

function renderNotice(site, news) {
  const pinned = (news || []).find((n) => n.pinned && n.published);
  if (!pinned) return;
  const bar = document.createElement("div");
  bar.className = "notice-bar";
  bar.innerHTML = `<div class="container">📢 <a href="news-detail.html?id=${esc(pinned.id)}">${esc(pinned.title)}</a>
    <button class="notice-close" aria-label="关闭">✕</button></div>`;
  $("#site-header").after(bar);
  bar.querySelector(".notice-close").addEventListener("click", () => bar.remove());
}

function renderFooter(site) {
  $("#site-footer").innerHTML = `
    <div class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="assets/img/logo.jpg" alt="队徽">
            <h4>${esc(site.clubName)}</h4>
            <p>${esc(site.school)}<br>${esc(site.teamCode)} · Since 2018</p>
          </div>
          <div>
            <h4>快速导航</h4>
            <a href="about.html">关于我们</a><a href="news.html">新闻动态</a>
            <a href="honors.html">荣誉墙</a><a href="robots.html">机器人作品集</a>
          </div>
          <div>
            <h4>联系我们</h4>
            <a href="mailto:${esc(site.email)}">✉ ${esc(site.email)}${site.emailPlaceholder ? "(占位)" : ""}</a>
            <a href="${esc(site.bilibili.url)}" target="_blank" rel="noopener">▶ B站:${esc(site.bilibili.name)}</a>
            <a href="${esc(site.github.url)}" target="_blank" rel="noopener">⌨ GitHub:${esc(site.github.name)}</a>
          </div>
          <div>
            <div class="footer-code">FTC<br>19726</div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        © 2026 ${esc(site.clubName)} · ${esc(site.clubNameEn)}
        ${site.icp ? " · " + esc(site.icp) : ""}
      </div>
    </div>`;
}

/* --- 通用小组件 --- */
function levelTag(level) { return `<span class="tag tag-${esc(level)}">${esc(level)}</span>`; }
function coverOrPlaceholder(src, cls = "c-img") {
  return src
    ? `<div class="${cls}" style="background:url('${esc(src)}') center/cover"></div>`
    : `<div class="${cls}"></div>`;
}
function countUp(el) {
  const target = Number(el.dataset.value) || 0;
  const suffix = el.dataset.suffix || "";
  const dur = 1200, t0 = performance.now();
  const tick = (t) => {
    const k = Math.min((t - t0) / dur, 1);
    el.innerHTML = Math.round(target * (0.2 + 0.8 * k)) + (suffix ? `<span class="suffix">${esc(suffix)}</span>` : "");
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ===== 页面渲染器 ===== */
const pages = {
  async index(site) {
    // Hero 轮播
    const slides = site.heroSlides || [];
    $("#hero").innerHTML = slides.map((s, i) => `
      <div class="hero-slide ${i === 0 ? "active" : ""}">
        <div class="hs-grid"></div>
        ${s.img ? `<div class="hs-img" style="background-image:url('${esc(s.img)}')"></div>` : ""}
        ${s.caption ? `<div class="hs-caption">${esc(s.caption)}</div>` : ""}
      </div>`).join("") + `
      <div class="hero-overlay"></div>
      <div class="container hero-text">
        <div class="h-en">${esc(site.sloganEn)}</div>
        <div class="h-slogan">${esc(site.slogan)}</div>
        <div class="hero-btns">
          <a class="btn btn-primary" href="robots.html">查看我们的机器人</a>
          <a class="btn btn-ghost" href="about.html">关于我们</a>
        </div>
      </div>
      <div class="hero-dots">${slides.map((_, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}"></button>`).join("")}</div>`;
    let cur = 0;
    const go = (i) => {
      cur = (i + slides.length) % slides.length;
      $$(".hero-slide").forEach((s, k) => s.classList.toggle("active", k === cur));
      $$(".hero-dots button").forEach((d, k) => d.classList.toggle("active", k === cur));
    };
    let timer = setInterval(() => go(cur + 1), 5000);
    $$(".hero-dots button").forEach((d) => d.addEventListener("click", () => { clearInterval(timer); go(+d.dataset.i); timer = setInterval(() => go(cur + 1), 5000); }));

    // 统计条
    $("#stats").innerHTML = `<div class="stats"><div class="container stats-grid">
      ${site.stats.map((s) => `<div class="stat"><div class="s-num" data-value="${s.value}" data-suffix="${esc(s.suffix || "")}">0</div><div class="s-label">${esc(s.label)}</div></div>`).join("")}
    </div></div>`;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } }));
    $$(".s-num").forEach((el) => io.observe(el));

    // 荣誉精选(级别权重排序前4)
    const lvw = { "国际": 3, "全国": 2, "市级": 1, "区级": 0 };
    const honors = parseCSV(await fetchText("data/honors.csv"))
      .sort((a, b) => (lvw[b.级别] ?? -1) - (lvw[a.级别] ?? -1) || b.年份 - a.年份).slice(0, 4);
    $("#featuredHonors").innerHTML = `<div class="container">
      <div class="section-head"><div class="eyebrow">Honors</div><h2>荣誉精选</h2><div class="desc">每一份荣誉,都是团队协作的成果</div></div>
      <div class="grid grid-4">${honors.map((h) => `
        <div class="card"><div class="c-body" style="gap:8px">
          ${levelTag(h.级别)}
          <div class="c-title">${esc(h.奖项名称)}</div>
          <div class="c-meta">${esc(h.赛事名称)} · ${esc(h.年份)}</div>
        </div></div>`).join("")}</div>
      <div class="section-more"><a class="btn btn-ghost btn-sm" href="honors.html">进入荣誉墙 →</a></div></div>`;

    // 机器人精选(最新赛季前4)
    const robots = await fetchJSON("data/robots.json");
    $("#featuredRobots").innerHTML = `<div class="container">
      <div class="section-head"><div class="eyebrow">Our Robots</div><h2>机器人精选</h2><div class="desc">从图纸到赛场,每一台都由社员亲手完成</div></div>
      <div class="grid grid-4">${robots.slice(0, 4).map((r) => `
        <a class="card" href="robot-detail.html?id=${esc(r.id)}">
          ${coverOrPlaceholder(r.cover)}
          <div class="c-body">
            <div class="c-meta"><span class="tag tag-season">${esc(r.season)}</span></div>
            <div class="c-title">${esc(r.name)}</div>
            <div class="c-desc">${esc(r.summary)}</div>
          </div></a>`).join("")}</div>
      <div class="section-more"><a class="btn btn-ghost btn-sm" href="robots.html">全部作品 →</a></div></div>`;

    // 新闻 + 置顶
    const news = await fetchJSON("data/news/index.json");
    const pub = news.filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date));
    renderNotice(site, pub);
    const pinned = pub.find((n) => n.pinned);
    $("#latestNews").innerHTML = `<div class="container">
      <div class="section-head"><div class="eyebrow">News</div><h2>最新动态</h2></div>
      <div class="news-layout">
        <div>${pub.slice(0, 3).map((n) => `
          <a class="news-item" href="news-detail.html?id=${esc(n.id)}">
            <div class="n-cover">NEWS</div>
            <div style="flex:1">
              <div class="c-meta"><span class="tag tag-cat">${esc(n.category)}</span> ${esc(n.date)}</div>
              <div class="c-title" style="margin:4px 0">${esc(n.title)}</div>
              <div class="c-desc">${esc(n.summary)}</div>
            </div></a>`).join("")}
          <div class="section-more"><a class="btn btn-ghost btn-sm" href="news.html">更多动态 →</a></div>
        </div>
        <div>${pinned ? `
          <div class="pinned-card">
            <div class="p-tag">📌 置顶公告</div>
            <h3>${esc(pinned.title)}</h3>
            <div class="c-meta">${esc(pinned.date)}</div>
            <p style="font-size:14px;margin:8px 0 14px">${esc(pinned.summary)}</p>
            <a class="btn btn-primary btn-sm" href="news-detail.html?id=${esc(pinned.id)}">查看详情</a>
          </div>` : `<div class="pinned-card"><h3>更多动态</h3><p style="font-size:14px">前往新闻页查看全部内容 →</p></div>`}
        </div>
      </div></div>`;

    // 新人横幅
    $("#newbieBanner").innerHTML = `<div class="container section" style="padding-top:0">
      <div class="banner-cta">
        <h3>${esc(site.newbieBanner)}</h3>
        <a class="btn btn-primary" href="newbie.html">查看新人专区 →</a>
      </div></div>`;

    // 关注我们
    $("#contact").innerHTML = `<div class="container section" style="padding-top:0">
      <div class="section-head"><div class="eyebrow">Follow Us</div><h2>关注我们</h2></div>
      <div class="contact-cards">
        <div class="contact-card"><div class="cc-icon">✉</div>
          <div><div class="cc-title">社团邮箱</div><div class="cc-sub">${esc(site.email)}${site.emailPlaceholder ? "(占位,待替换)" : ""}</div></div></div>
        <a class="contact-card" href="${esc(site.bilibili.url)}" target="_blank" rel="noopener"><div class="cc-icon">▶</div>
          <div><div class="cc-title">B站空间</div><div class="cc-sub">${esc(site.bilibili.name)}</div></div></a>
      </div></div>`;
  },

  async about(site) {
    $("#about-body").innerHTML = site.aboutIntro.map((t) => `<p>${esc(t)}</p>`).join("");
    const teams = await fetchJSON("data/teams.json");
    $("#teams").innerHTML = `<div class="grid grid-4">${teams.map((t) => `
      <div class="card dir-card"><div class="d-en">${esc(t.en)}</div><h3>${esc(t.name)}</h3>
      <p style="font-size:14px;color:var(--gray)">${esc(t.duty)}</p></div>`).join("")}</div>`;
  },

  async history() {
    const tl = await fetchJSON("data/timeline.json");
    $("#timeline").innerHTML = tl.map((n) => `
      <div class="tl-item"><div class="tl-year">${esc(n.year)}</div>
      <div class="tl-card"><div class="tl-title">${esc(n.title)}</div>
      <div style="font-size:14px;color:var(--gray)">${esc(n.desc)}</div></div></div>`).join("");
  },

  async news(site) {
    const all = (await fetchJSON("data/news/index.json")).filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date));
    renderNotice(site, all);
    let cat = "全部", page = 1;
    const cats = ["全部", "赛事报道", "社团活动", "通知公告"];
    $("#tabs").innerHTML = cats.map((c) => `<button class="chip ${c === cat ? "active" : ""}" data-c="${c}">${c}</button>`).join("");
    $$("#tabs .chip").forEach((b) => b.addEventListener("click", () => {
      cat = b.dataset.c; page = 1;
      $$("#tabs .chip").forEach((x) => x.classList.toggle("active", x === b));
      render();
    }));
    function render() {
      const list = cat === "全部" ? all : all.filter((n) => n.category === cat);
      const pages = Math.max(1, Math.ceil(list.length / 9));
      page = Math.min(page, pages);
      const slice = list.slice((page - 1) * 9, page * 9);
      $("#newsList").innerHTML = slice.map((n) => `
        <a class="news-item" href="news-detail.html?id=${esc(n.id)}">
          <div class="n-cover">NEWS</div>
          <div style="flex:1">
            <div class="c-meta"><span class="tag tag-cat">${esc(n.category)}</span> ${esc(n.date)}${n.pinned ? ' <span class="tag tag-pinned">置顶</span>' : ""}</div>
            <div class="c-title" style="margin:4px 0">${esc(n.title)}</div>
            <div class="c-desc">${esc(n.summary)}</div>
          </div></a>`).join("") || '<div class="loading">该分类暂无内容</div>';
      if (pages > 1) {
        $("#newsList").insertAdjacentHTML("beforeend", `<div class="section-more">${Array.from({ length: pages }, (_, i) =>
          `<button class="chip ${i + 1 === page ? "active" : ""}" data-p="${i + 1}">${i + 1}</button>`).join("")}</div>`);
        $$("#newsList [data-p]").forEach((b) => b.addEventListener("click", () => { page = +b.dataset.p; render(); window.scrollTo(0, 0); }));
      }
    }
    render();
  },

  async newsDetail(site) {
    const id = new URLSearchParams(location.search).get("id");
    const idx = await fetchJSON("data/news/index.json");
    const item = idx.find((n) => n.id === id && n.published);
    if (!item) { $("#article").innerHTML = "<div class=loading>未找到该文章</div>"; return; }
    document.title = item.title + " · " + site.clubName;
    let body = "";
    try { body = renderMD(await fetchText(`data/news/${id}.md`)); }
    catch { body = "<p>正文加载失败。</p>"; }
    $("#article").innerHTML = `
      <a href="news.html" style="font-size:14px">← 返回新闻动态</a>
      <h1 style="margin-top:12px">${esc(item.title)}</h1>
      <div class="a-meta"><span class="tag tag-cat">${esc(item.category)}</span> ${esc(item.date)}</div>
      <div class="a-body">${body}</div>`;
  },

  async honors() {
    let rows = parseCSV(await fetchText("data/honors.csv"));
    let fCat = "全部", fLevel = "全部", fYear = "全部";
    $("#sampleTip").style.display = rows.some((r) => r.备注.includes("示例")) ? "" : "none";
    const uniq = (k) => ["全部", ...new Set(rows.map((r) => r[k]))];
    const chipRow = (id, values, cur, set) => {
      $(id).innerHTML = values.map((v) => `<button class="chip ${v === cur ? "active" : ""}">${v}</button>`).join("");
      $$(id + " .chip").forEach((b) => b.addEventListener("click", () => { set(b.textContent); render(); }));
    };
    chipRow("#fCat", uniq("类别"), fCat, (v) => (fCat = v));
    chipRow("#fLevel", uniq("级别"), fLevel, (v) => (fLevel = v));
    chipRow("#fYear", uniq("年份").sort().reverse(), fYear, (v) => (fYear = v));
    const lvw = { "国际": 3, "全国": 2, "市级": 1, "区级": 0 };
    function render() {
      const list = rows.filter((r) => (fCat === "全部" || r.类别 === fCat) && (fLevel === "全部" || r.级别 === fLevel) && (fYear === "全部" || r.年份 === fYear))
        .sort((a, b) => (lvw[b.级别] ?? -1) - (lvw[a.级别] ?? -1) || b.年份 - a.年份);
      $("#honorCount").textContent = list.length;
      $("#honorList").innerHTML = list.map((h) => `
        <div class="honor-row">
          <div class="h-year">${esc(h.年份)}</div>${levelTag(h.级别)}
          <div class="h-award">${esc(h.奖项名称)}</div>
          <div class="h-event">${esc(h.赛事名称)}<div class="h-robot">${h.关联机器人 ? "关联:" + esc(h.关联机器人) : ""}</div></div>
          <div class="h-robot">${esc(h.类别)}</div>
        </div>`).join("") || '<div class="loading">该筛选下暂无记录</div>';
    }
    render();
  },

  async robots() {
    const robots = await fetchJSON("data/robots.json");
    const seasons = [...new Set(robots.map((r) => r.season))].sort().reverse();
    $("#robotList").innerHTML = seasons.map((s) => `
      <div class="season-block" id="s-${esc(s)}">
        <div class="se-head"><div class="se-title">${esc(s)} SEASON</div><div class="se-theme">${seasonTheme(s)}</div></div>
        ${robots.filter((r) => r.season === s).map((r) => `
          <a class="robot-card" href="robot-detail.html?id=${esc(r.id)}">
            <div class="r-img">${r.cover ? `<img src="${esc(r.cover)}" alt="">` : "NO PHOTO"}</div>
            <div class="r-body">
              <div class="c-meta"><span class="tag tag-season">${esc(r.season)}</span></div>
              <div class="c-title">${esc(r.name)}</div>
              <div class="c-desc">${esc(r.summary)}</div>
              <div class="section-more" style="margin:0;text-align:left"><span style="color:var(--blue-acc);font-size:14px">查看详情 →</span></div>
            </div></a>`).join("")}
      </div>`).join("");
  },

  async robotDetail(site) {
    const id = new URLSearchParams(location.search).get("id");
    const robots = await fetchJSON("data/robots.json");
    const r = robots.find((x) => x.id === id);
    if (!r) { $("#robotDetail").innerHTML = "<div class=loading>未找到该机器人</div>"; return; }
    document.title = r.name + " · " + site.clubName;
    $("#robotDetail").innerHTML = `
      <a href="robots.html" style="font-size:14px">← 返回作品集</a>
      <div class="r-img" style="border-radius:var(--radius);margin:12px 0;min-height:320px;background:linear-gradient(135deg,var(--ice),#d9e6fb);display:flex;align-items:center;justify-content:center;color:rgba(0,32,91,.25);font-family:var(--font-num);letter-spacing:.2em">
        ${r.cover ? `<img src="${esc(r.cover)}" alt="" style="width:100%;object-fit:cover">` : "NO PHOTO · 封面图占位"}</div>
      <div class="c-meta" style="margin:12px 0"><span class="tag tag-season">${esc(r.season)}</span></div>
      <h1 style="color:var(--blue);font-size:30px">${esc(r.name)}</h1>
      <p style="color:var(--gray);margin:6px 0 20px">${esc(r.summary)}</p>
      <div class="sub-heading">这台机器人</div>
      <div class="about-body"><p>${esc(r.story).replace(/\n/g, "</p><p>")}</p></div>
      <div class="sub-heading">技术参数</div>
      <table class="spec-table">${r.specs.map((s) => `<tr><td>${esc(s.k)}</td><td>${esc(s.v)}</td></tr>`).join("")}</table>
      <div class="sub-heading">建模展示</div>
      ${r.cad && r.cad.mode === "images" && r.cad.images.length
        ? `<div class="grid grid-3">${r.cad.images.map((i) => `<img src="${esc(i)}" style="border-radius:var(--radius)">`).join("")}</div>`
        : r.cad && r.cad.mode === "embed" && r.cad.embedUrl
          ? `<iframe src="${esc(r.cad.embedUrl)}" style="width:100%;height:480px;border:none;border-radius:var(--radius)"></iframe>`
          : `<div class="empty-box"><span class="eb-icon">📐</span>CAD 模型资料整理中——此处将展示建模图集或三维预览(由设计组在后台填入)</div>`}
      <div class="sub-heading">代码仓库</div>
      ${r.repo && r.repo.url
        ? `<div class="repo-card"><div class="rc-icon">⌨</div><div><div style="font-weight:600">${esc(r.repo.desc || "赛季代码仓库")}</div>
           <a href="${esc(r.repo.url)}" target="_blank" rel="noopener">${esc(r.repo.url)}</a></div></div>`
        : `<div class="empty-box"><span class="eb-icon">⌨</span>代码仓库整理中——此处将展示 GitHub 仓库卡片与代码片段(由编程组在后台填入)</div>`}
      <div class="sub-heading">相关视频</div>
      ${r.videoIds && r.videoIds.length
        ? r.videoIds.map((v) => `<div style="aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;margin-bottom:16px"><iframe src="https://player.bilibili.com/player.html?bvid=${esc(v)}" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div>`).join("")
        : `<div class="empty-box"><span class="eb-icon">▶</span>视频资料整理中——此处将嵌入 B 站比赛视频(后台填入视频 ID 即可)</div>`}`;
  },

  async newbie(site) {
    $("#newbieIntro").textContent = "从零基础到赛场,这里是你加入 FFFabulous 的第一站。";
    $("#dirCards").innerHTML = `
      <div class="card dir-card"><div class="d-icon">💻</div><div class="d-en">PROGRAMMING</div><h3>编程</h3>
        <ul><li>机器人控制与自动程序</li><li>视觉识别与传感器</li><li>调试与数据分析</li></ul>
        <a class="btn btn-primary btn-sm" href="https://github.com/FFFabulousRobotics/Real-Courses" target="_blank" rel="noopener">Real-Courses 教程</a></div>
      <div class="card dir-card"><div class="d-icon">🔧</div><div class="d-en">ENGINEERING</div><h3>工程</h3>
        <ul><li>机械结构设计与装配</li><li>机构创新与迭代</li><li>赛场维护检修</li></ul>
        <a class="btn btn-ghost btn-sm" href="https://github.com/FFFabulousRobotics/FtcRobotController" target="_blank" rel="noopener">镜像版 FTC SDK</a></div>
      <div class="card dir-card"><div class="d-icon">📐</div><div class="d-en">DESIGN</div><h3>设计</h3>
        <ul><li>CAD 建模与出图</li><li>机器人外观设计</li><li>宣传视觉物料</li></ul>
        <a class="btn btn-ghost btn-sm" href="https://www.bilibili.com/video/BV17BJp65EUf/" target="_blank" rel="noopener">Onshape 入门视频</a></div>
      <div class="card dir-card"><div class="d-icon">🤝</div><div class="d-en">OUTREACH</div><h3>外联</h3>
        <ul><li>赞助洽谈与外联</li><li>赛事报名事务</li><li>公众号与宣传</li></ul>
        <a class="btn btn-ghost btn-sm" href="https://gm0.org/zh-cn/latest/" target="_blank" rel="noopener">GM0 通识入门</a></div>`;
    const res = await fetchJSON("data/resources.json");
    const groups = ["综合入门", "编程", "工程", "设计", "外联"].filter((g) => res.some((r) => r.group === g));
    let g = groups[0];
    $("#resTabs").innerHTML = groups.map((x) => `<button class="chip ${x === g ? "active" : ""}" data-g="${x}">${x}</button>`).join("");
    $("#resList").innerHTML = "";
    function renderRes() {
      $("#resList").innerHTML = `<div class="grid grid-3">${res.filter((r) => r.group === g).map((r) => `
        <a class="card" href="${esc(r.url)}" target="_blank" rel="noopener"><div class="c-body" style="gap:8px">
          <div class="c-title">🔗 ${esc(r.name)}</div><div class="c-desc">${esc(r.desc)}</div>
        </div></a>`).join("")}</div>`;
    }
    $$("#resTabs .chip").forEach((b) => b.addEventListener("click", () => {
      g = b.dataset.g;
      $$("#resTabs .chip").forEach((x) => x.classList.toggle("active", x === b));
      renderRes();
    }));
    renderRes();
    // FAQ
    const faq = [
      ["零基础可以加入吗?", "可以。编程方向有社员自编的双语新手教程 Real-Courses(Course 0-3),从开发环境搭建一步步教起;多数成员入社时没有任何基础。"],
      ["四个组怎么选?", "入社后先完成入门任务,再根据自己的兴趣双向选择。"],
      ["参赛需要什么条件?", "以训练出勤和任务完成度为准,赛季前确定出场名单。"],
      ["会影响学习吗?", "活动集中在社团课与周末,赛季冲刺期会提前协调安排。"],
    ];
    $("#faq").innerHTML = faq.map(([q, a]) => `
      <div class="faq-item"><button class="faq-q">${esc(q)}</button><div class="faq-a">${esc(a)}</div></div>`).join("");
    $$(".faq-q").forEach((b) => b.addEventListener("click", () => b.parentElement.classList.toggle("open")));
  },

  async gallery() {
    const albums = await fetchJSON("data/gallery.json");
    $("#albums").innerHTML = albums.map((a) => {
      const cover = a.cover || (a.photos[0] || {}).src || "";
      return `<a class="card" href="#" data-album="${esc(a.id)}">
        ${coverOrPlaceholder(cover)}
        <div class="c-body"><div class="c-meta">${esc(a.date)} · ${a.photos.length} 张</div>
        <div class="c-title">${esc(a.title)}</div></div></a>`;
    }).join("");
    const lb = $("#lightbox");
    let curPhotos = [], curIdx = 0;
    const show = (i) => {
      curIdx = (i + curPhotos.length) % curPhotos.length;
      const p = curPhotos[curIdx];
      $("#lbBody").innerHTML = p.src ? `<img src="${esc(p.src)}" alt="">` : `<div class="ph" style="width:min(70vw,640px);aspect-ratio:4/3;background:linear-gradient(135deg,var(--ice),#d9e6fb);display:flex;align-items:center;justify-content:center;color:rgba(0,32,91,.3);font-family:var(--font-num)">FTC 19726</div>`;
      $("#lbCaption").textContent = p.caption || "";
    };
    $$("[data-album]").forEach((card) => card.addEventListener("click", (e) => {
      e.preventDefault();
      const album = albums.find((a) => a.id === card.dataset.album);
      curPhotos = album.photos;
      show(0);
      lb.classList.add("open");
    }));
    $(".lb-close").addEventListener("click", () => lb.classList.remove("open"));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.classList.remove("open"); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open");
      if (e.key === "ArrowRight") show(curIdx + 1);
      if (e.key === "ArrowLeft") show(curIdx - 1);
    });
  },
};

function seasonTheme(season) {
  const map = {
    "2026-2027": "BIOBUZZ", "2025-2026": "DECODE", "2024-2025": "INTO THE DEEP",
    "2023-2024": "CENTERSTAGE", "2022-2023": "POWERPLAY",
  };
  return map[season] ? "主题 · " + map[season] : "";
}

/* ===== 启动 ===== */
(async () => {
  const page = document.body.dataset.page;
  const site = await fetchJSON("data/site.json");
  document.title = (pages[page] ? "" : "") + site.clubName + " · " + site.teamCode;
  renderHeader(site);
  renderFooter(site);
  try { if (pages[page]) await pages[page](site); }
  catch (err) { console.error(err); const el = $("#pageError") || $("#article") || $("main"); if (el) el.insertAdjacentHTML("afterbegin", `<div class="loading">内容加载失败:${esc(err.message)}</div>`); }
  // 返回顶部
  const bt = document.createElement("button");
  bt.className = "back-top"; bt.textContent = "↑"; bt.setAttribute("aria-label", "返回顶部");
  document.body.appendChild(bt);
  window.addEventListener("scroll", () => bt.classList.toggle("show", window.scrollY > 600));
  bt.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
