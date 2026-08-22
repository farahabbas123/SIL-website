// ============================================================
// STEP INTO INTL LAW — shared behaviour
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile nav toggle ----------
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  // ---------- Fade-in on scroll ----------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ---------- Hero: night-earth dot globe (home page only) ----------
  const globeCanvas = document.getElementById('globe-canvas');
  if (globeCanvas) {
    const ctx = globeCanvas.getContext('2d');
    let W, H, dpr;

    function resizeGlobe() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = globeCanvas.offsetWidth; H = globeCanvas.offsetHeight;
      globeCanvas.width = W * dpr; globeCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resizeGlobe);
    resizeGlobe();

    const points = [];
    const rows = 46, cols = 92;
    function landish(u, v) {
      const bands = [
        { y: 0.28, y2: 0.52, x: 0.02, x2: 0.28 },
        { y: 0.5, y2: 0.78, x: 0.18, x2: 0.34 },
        { y: 0.22, y2: 0.42, x: 0.42, x2: 0.58 },
        { y: 0.34, y2: 0.72, x: 0.42, x2: 0.62 },
        { y: 0.2, y2: 0.55, x: 0.6, x2: 0.92 },
        { y: 0.62, y2: 0.8, x: 0.78, x2: 0.94 }
      ];
      for (const b of bands) {
        if (v > b.y && v < b.y2 && u > b.x && u < b.x2) {
          const nx = Math.sin(u * 37 + v * 19) * Math.cos(v * 23);
          if (nx > -0.35) return true;
        }
      }
      return false;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / cols, v = r / rows;
        if (landish(u, v) && Math.random() > 0.15) {
          points.push({ u, v, tw: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.4 });
        }
      }
    }

    let t = 0;
    function drawGlobe() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      const marginX = W * 0.06, marginY = H * 0.22;
      const spanX = W - marginX * 2, spanY = H * 0.62;
      for (const p of points) {
        const x = marginX + p.u * spanX;
        const y = marginY + p.v * spanY;
        const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * p.sp + p.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(201,162,39,${0.12 + flicker * 0.55})`;
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(drawGlobe);
    }
    drawGlobe();
  }

  // ---------- Map preview: animated pins (home page) ----------
  const pinCanvas = document.getElementById('pin-canvas');
  if (pinCanvas) {
    const ctx = pinCanvas.getContext('2d');
    let W, H, dpr;
    function resizePins() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = pinCanvas.offsetWidth; H = pinCanvas.offsetHeight;
      pinCanvas.width = W * dpr; pinCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resizePins);
    resizePins();

    const jobPins = [
      { x: 0.22, y: 0.3, label: '2027 Graduate — CommBank' },
      { x: 0.5, y: 0.22, label: '2027 Graduate — KPMG' },
      { x: 0.62, y: 0.4, label: '2027 Graduate — EY' },
      { x: 0.82, y: 0.68, label: '2027 Graduate — QBE' },
      { x: 0.35, y: 0.6, label: 'Legal Intern — UN OLA' },
    ];
    const scholarPins = [
      { x: 0.44, y: 0.28, label: 'Rhodes Scholarship — Oxford' },
      { x: 0.2, y: 0.34, label: 'Fulbright — United States' },
      { x: 0.58, y: 0.5, label: 'Chevening — UK' },
      { x: 0.8, y: 0.62, label: 'Endeavour — Australia' },
      { x: 0.68, y: 0.24, label: 'DAAD — Germany' },
    ];
    let mode = 'jobs';
    let pins = jobPins;
    let hoverIdx = -1;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        pins = mode === 'jobs' ? jobPins : scholarPins;
      });
    });

    pinCanvas.addEventListener('mousemove', (e) => {
      const rect = pinCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      hoverIdx = -1;
      pins.forEach((p, i) => {
        const px = p.x * W, py = p.y * H;
        if (Math.hypot(mx - px, my - (py - 18)) < 14) hoverIdx = i;
      });
    });

    let t = 0;
    function drawPins() {
      t += 0.02;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(238,241,247,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      pins.forEach((p, i) => {
        const px = p.x * W, py = p.y * H;
        const bob = Math.sin(t * 1.4 + i) * 2;
        const pulse = (t * 0.7 + i * 0.3) % 1;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(201,162,39,${0.5 - pulse * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.arc(px, py + bob, 6 + pulse * 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = i === hoverIdx ? '#e0b62f' : '#c9a227';
        ctx.arc(px, py + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#060c1e';
        ctx.arc(px, py + bob, 2.4, 0, Math.PI * 2);
        ctx.fill();

        if (i === hoverIdx) {
          ctx.font = "500 12px 'IBM Plex Mono', monospace";
          const tw = ctx.measureText(p.label).width;
          const bx = px + 14, by = py + bob - 30;
          ctx.fillStyle = 'rgba(10,18,41,0.95)';
          ctx.strokeStyle = 'rgba(201,162,39,0.5)';
          ctx.lineWidth = 1;
          ctx.fillRect(bx - 8, by - 18, tw + 16, 26);
          ctx.strokeRect(bx - 8, by - 18, tw + 16, 26);
          ctx.fillStyle = '#eef1f7';
          ctx.fillText(p.label, bx, by);
        }
      });
      requestAnimationFrame(drawPins);
    }
    drawPins();
  }

  // ---------- Scholarship board: filter tabs ----------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const boardRows = document.querySelectorAll('.board-row');
  if (filterBtns.length && boardRows.length) {
    const emptyState = document.querySelector('.board-empty');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        let visibleCount = 0;
        boardRows.forEach(row => {
          const match = type === 'all' || row.dataset.type === type;
          row.style.display = match ? 'grid' : 'none';
          if (match) visibleCount++;
        });
        if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      });
    });
  }

  // ---------- Sign in / Sign up tab switch ----------
  const authTabs = document.querySelectorAll('.auth-tab');
  if (authTabs.length) {
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(tab.dataset.panel).classList.add('active');
      });
    });
  }

  // ---------- Contact form (front-end only demo) ----------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      document.querySelector('.form-success').classList.add('visible');
      contactForm.reset();
    });
  }

  // ---------- Sign in / Sign up forms (front-end only demo) ----------
  document.querySelectorAll('.auth-panel form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('This is a design preview — account creation isn\'t connected yet.');
    });
  });

});
