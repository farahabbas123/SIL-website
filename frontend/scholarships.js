// ============================================================
// SCHOLARSHIPS BOARD — fetches live opportunities from the API
// and renders + filters them client-side.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const rowsEl = document.getElementById('board-rows');
  if (!rowsEl) return; // not the scholarships page

  const loadingEl = document.getElementById('board-loading');
  const errorEl = document.getElementById('board-error');
  const emptyEl = document.querySelector('.board-empty');
  const filterBtns = document.querySelectorAll('.filter-btn');

  const TYPE_LABELS = {
    'undergraduate': 'Undergraduate',
    'postgrad-coursework': 'Postgraduate (Coursework)',
    'postgrad-research': 'Postgraduate (Research)',
    'short-course': 'Short Course / Study Tour',
    'other': 'Other',
  };

  function formatClosingDate(iso) {
    if (!iso) return 'Rolling applications';
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function renderRow(opportunity) {
    const row = document.createElement('a');
    row.className = 'board-row';
    row.dataset.type = opportunity.type;
    row.href = opportunity.url;
    row.target = '_blank';
    row.rel = 'noopener';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = opportunity.name;

    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = opportunity.location;

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = TYPE_LABELS[opportunity.type] || opportunity.type;

    const closing = document.createElement('div');
    closing.className = opportunity.closingSoon ? 'closing soon' : 'closing';
    closing.textContent = formatClosingDate(opportunity.closingDate);

    row.append(name, sub, tag, closing);
    return row;
  }

  function applyFilter(type) {
    const rows = rowsEl.querySelectorAll('.board-row');
    let visibleCount = 0;
    rows.forEach(row => {
      const match = type === 'all' || row.dataset.type === type;
      row.style.display = match ? 'grid' : 'none';
      if (match) visibleCount++;
    });
    if (emptyEl) emptyEl.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.type);
    });
  });

  fetch('/api/v1/opportunities')
    .then(res => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then(body => {
      const opportunities = (body && body.data && body.data.opportunities) || [];
      rowsEl.append(...opportunities.map(renderRow));
      if (loadingEl) loadingEl.style.display = 'none';
      const activeBtn = document.querySelector('.filter-btn.active');
      applyFilter(activeBtn ? activeBtn.dataset.type : 'all');
    })
    .catch(() => {
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'block';
    });

});
