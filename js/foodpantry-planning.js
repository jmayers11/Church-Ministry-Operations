/* =============================================================
   foodpantry-planning.js  —  Food Pantry Resource Planning (FPRP)
   -------------------------------------------------------------
   A lightweight ministry MRP layer over the existing Food Pantry.
   Adds a read-only "Planning" tab with operational intelligence:
     1. Box Build Capacity Analysis
     2. Inventory Consumption Calculator
     3. Replenishment Planner
     4. Distribution Readiness Dashboard
     5. Substitute Item Engine
     6. Box Template Optimizer
     7. Donation Planning
     8. Pantry Health Score
     9. Executive Reporting
   Does NOT modify existing tabs, data, or workflows. All numbers
   are computed live from pantry_inventory, pantry_box_templates,
   pantry_build_orders, pantry_box_orders, and foodpantry (distributions).
   ============================================================= */

// Seed a few default substitution rules when none exist (config, not demo data).
(function seedSubs() {
  if ((Storage.getAll('pantry_substitutions') || []).length) return;
  const uid = Storage.uid;
  Storage.saveAll('pantry_substitutions', [
    { id: uid(), fromItem: 'Canned Green Beans', fromQty: 1, toItem: 'Canned Corn',        toQty: 1, note: 'Vegetable swap' },
    { id: uid(), fromItem: 'Cereal (Cheerios)',  fromQty: 1, toItem: 'Instant Oatmeal',    toQty: 1, note: 'Breakfast swap' },
    { id: uid(), fromItem: 'Peanut Butter',      fromQty: 1, toItem: 'Canned Chicken',     toQty: 2, note: 'Protein swap (1 jar ≈ 2 cans)' },
    { id: uid(), fromItem: 'Rice (Long Grain)',  fromQty: 1, toItem: 'Pasta (Spaghetti)',  toQty: 1, note: 'Starch swap' },
    { id: uid(), fromItem: 'Canned Chicken',     fromQty: 1, toItem: 'Canned Tuna',         toQty: 1, note: 'Protein swap' },
  ]);
})();

var FPRP = (function () {
  'use strict';

  // ── helpers ────────────────────────────────────────────────
  function _today() { return Storage.today(); }
  function _daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function _addDays(days) { const d = new Date(); d.setDate(d.getDate() + Math.round(days)); return d; }
  function _monYear(d) { return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
  function _num(n) { return Number(n) || 0; }
  function _round(n) { return Math.round(n); }

  function _matchInv(inv, name) {
    if (!name) return null;
    const lc = name.toLowerCase();
    return (inv || [])
      .filter(function (i) { const n = (i.name || '').toLowerCase(); return n === lc || n.includes(lc) || lc.includes(n); })
      .sort(function (a, b) { return b.qty - a.qty; })[0] || null;
  }

  function data() {
    return {
      inv:       Storage.getAll('pantry_inventory') || [],
      templates: Storage.getAll('pantry_box_templates') || [],
      dists:     (Storage.getAll('foodpantry') || []).slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); }),
      builds:    Storage.getAll('pantry_build_orders') || [],
      orders:    Storage.getAll('pantry_box_orders') || [],
      subs:      Storage.getAll('pantry_substitutions') || [],
      subLog:    Storage.getAll('pantry_substitution_log') || [],
    };
  }

  function _writeThrough(coll, rec) {
    if (rec && typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) {
      SupabaseDB.tableUpsert(coll, rec).catch(function () {});
    }
  }
  function _goto() { Storage.set('_pantryTab', 'planning'); Navigation.navigate('foodpantry'); }

  // ── consumption model (Feature 2 core) ─────────────────────
  // Real usage = items actually consumed by builds + completed/distributed orders.
  // Returned orders restored stock, so they are excluded.
  function consumptionEvents(d) {
    const ev = [];
    (d.builds || []).forEach(function (b) {
      (b.itemsConsumed || []).forEach(function (c) { ev.push({ date: (b.date || '').slice(0, 10), name: c.itemName, qty: _num(c.qty) }); });
    });
    (d.orders || []).forEach(function (o) {
      if (o.status === 'Completed' || o.status === 'Distributed') {
        (o.itemsConsumed || []).forEach(function (c) { ev.push({ date: (o.completedAt || o.createdAt || '').slice(0, 10), name: c.itemName, qty: _num(c.qty) }); });
      }
    });
    return ev.filter(function (e) { return e.date; });
  }

  function consumptionByItem(d) {
    const ev = consumptionEvents(d);
    const today = _today();
    let earliest = today;
    ev.forEach(function (e) { if (e.date < earliest) earliest = e.date; });
    const actualDays = ev.length ? (_daysBetween(earliest, today) || 0) : 0;
    const windowDays = Math.min(180, Math.max(30, actualDays || 30));
    const cut30 = Storage.today(-30), cut60 = Storage.today(-60);
    const map = {};
    ev.forEach(function (e) {
      const inv = _matchInv(d.inv, e.name);
      const key = inv ? inv.name : e.name;
      if (!map[key]) map[key] = { total: 0, last30: 0, prev30: 0, onHand: inv ? _num(inv.qty) : 0, unit: inv ? inv.unit : '', invId: inv ? inv.id : null };
      map[key].total += e.qty;
      if (e.date >= cut30) map[key].last30 += e.qty;
      else if (e.date >= cut60) map[key].prev30 += e.qty;
    });
    Object.keys(map).forEach(function (k) {
      const m = map[k];
      m.monthly = m.total / (windowDays / 30);
      m.weekly = m.monthly / 4.345;
      m.trend = m.last30 > m.prev30 * 1.1 ? 'up' : (m.last30 < m.prev30 * 0.9 ? 'down' : 'flat');
      m.daysSupply = m.monthly > 0 ? Math.round(m.onHand / (m.monthly / 30)) : Infinity;
    });
    return { map: map, windowDays: windowDays, actualDays: actualDays };
  }

  // ── build capacity (Feature 1) ─────────────────────────────
  function capacity(t, inv) {
    let maxBuild = Infinity, best = 0, limiting = null;
    const lines = (t.items || []).map(function (l) {
      const m = _matchInv(inv, l.itemName);
      const onHand = m ? _num(m.qty) : 0;
      const per = _num(l.qty);
      const boxes = per > 0 ? Math.floor(onHand / per) : 0;
      if (boxes > best) best = boxes;
      if (boxes < maxBuild) { maxBuild = boxes; limiting = l.itemName; }
      return { name: l.itemName, per: per, unit: l.unit, onHand: onHand, boxes: boxes, found: !!m };
    });
    if (!lines.length || maxBuild === Infinity) maxBuild = 0;
    const health = best > 0 ? Math.round((maxBuild / best) * 100) : 0;
    return { maxBuild: maxBuild, limiting: limiting, health: health, lines: lines };
  }

  function projectedFamilies(d) {
    const recent = (d.dists || []).slice(-3);
    if (!recent.length) return 0;
    return Math.round(recent.reduce(function (s, r) { return s + _num(r.familiesServed); }, 0) / recent.length);
  }

  // ── readiness (Feature 4) ──────────────────────────────────
  function readiness(d) {
    const proj = projectedFamilies(d) || 1;
    const perTemplate = (d.templates || []).map(function (t) {
      const c = capacity(t, d.inv);
      return { name: t.name, color: t.color, maxBuild: c.maxBuild, limiting: c.limiting, health: c.health };
    });
    const score = perTemplate.length
      ? Math.round(perTemplate.reduce(function (s, p) { return s + Math.min(1, p.maxBuild / proj); }, 0) / perTemplate.length * 100)
      : 0;
    return { proj: proj, perTemplate: perTemplate, score: score };
  }

  // ── compact snapshot for the main dashboard tile ───────────
  function pantrySnapshot() {
    try {
      const d = data();
      if (!d.templates.length || !d.inv.length) return { hasData: false };
      const r = readiness(d);
      const top = (r.perTemplate || []).reduce(function (a, b) {
        return b.maxBuild > a.maxBuild ? b : a;
      }, { maxBuild: 0, name: '—' });
      return {
        hasData: true,
        score: r.score,
        projFamilies: r.proj,
        topBox: { maxBuild: top.maxBuild, name: top.name },
      };
    } catch (e) {
      return { hasData: false };
    }
  }

  // ── replenishment (Feature 3) ──────────────────────────────
  function replenishment(d) {
    const cons = consumptionByItem(d).map;
    return (d.inv || []).map(function (i) {
      const c = cons[i.name];
      const monthly = c ? c.monthly : 0;
      const daily = monthly / 30;
      const days = daily > 0 ? Math.round(_num(i.qty) / daily) : Infinity;
      let zone = days >= 90 ? 'green' : days >= 30 ? 'yellow' : 'red';
      if (monthly === 0 && _num(i.qty) > _num(i.minStock)) zone = 'green';
      const target = Math.max(_num(i.minStock), Math.ceil(daily * 90));
      const suggest = Math.max(0, target - _num(i.qty));
      return { item: i, monthly: monthly, days: days, zone: zone, suggest: suggest };
    });
  }

  // ── template optimizer (Feature 6) ─────────────────────────
  function optimizer(d) {
    const demand = {};
    (d.builds || []).forEach(function (b) { demand[b.templateName] = (demand[b.templateName] || 0) + _num(b.quantity); });
    (d.orders || []).forEach(function (o) { if (o.status !== 'Returned') demand[o.templateName] = (demand[o.templateName] || 0) + _num(o.quantity); });
    const rows = (d.templates || []).map(function (t) {
      const c = capacity(t, d.inv);
      const weight = (t.items || []).reduce(function (s, l) { return s + _num(l.qty); }, 0); // total items packed per box (provisioning depth per family)
      return { t: t, cap: c, weight: weight, demand: demand[t.name] || 0 };
    });
    if (!rows.length) return null;
    const byWeight = rows.slice().sort(function (a, b) { return b.weight - a.weight; });
    const byBuild  = rows.slice().sort(function (a, b) { return b.cap.maxBuild - a.cap.maxBuild; });
    const byDemand = rows.slice().sort(function (a, b) { return b.demand - a.demand; });
    return { rows: rows, mostExpensive: byWeight[0], lowestRisk: byBuild[0], highestDemand: byDemand[0], mostSustainable: byBuild[0] };
  }

  // ── pantry health score (Feature 8) ────────────────────────
  function healthScore(d) {
    const inv = d.inv || [];
    const cons = consumptionByItem(d).map;
    const aboveMin = inv.length ? inv.filter(function (i) { return _num(i.qty) > _num(i.minStock); }).length / inv.length : 1;
    const used = Object.keys(cons);
    const safe = used.filter(function (k) { return cons[k].daysSupply >= 30; }).length;
    const stockout = used.length ? safe / used.length : 1;
    const templ = (d.templates || []).length ? d.templates.filter(function (t) { return capacity(t, inv).maxBuild > 0; }).length / d.templates.length : 0;
    const r = readiness(d);
    const distReady = r.score / 100;
    const recent = (d.dists || []).slice(-3);
    const avgHrs = recent.length ? recent.reduce(function (s, x) { return s + _num(x.volunteerHours); }, 0) / recent.length : 0;
    const volAvail = Math.min(1, avgHrs / 16);
    const factors = [
      { label: 'Inventory Levels',       val: aboveMin },
      { label: 'Stockout Risk',          val: stockout },
      { label: 'Template Coverage',      val: templ },
      { label: 'Distribution Readiness', val: distReady },
      { label: 'Volunteer Availability', val: volAvail },
    ];
    const score = Math.round(factors.reduce(function (s, f) { return s + f.val; }, 0) / factors.length * 100);
    const primaryRisk = factors.slice().sort(function (a, b) { return a.val - b.val; })[0];
    return { score: score, factors: factors, primaryRisk: primaryRisk };
  }

  // ── substitution suggestions (Feature 5) ───────────────────
  function subSuggestions(d, shortNames) {
    const out = [];
    (shortNames || []).forEach(function (name) {
      (d.subs || []).forEach(function (s) {
        const lc = name.toLowerCase();
        if ((s.fromItem || '').toLowerCase() === lc || (s.fromItem || '').toLowerCase().includes(lc) || lc.includes((s.fromItem || '').toLowerCase())) {
          const alt = _matchInv(d.inv, s.toItem);
          out.push({ from: name, to: s.toItem, ratio: (s.fromQty || 1) + ':' + (s.toQty || 1), available: alt ? _num(alt.qty) : 0, note: s.note || '' });
        }
      });
    });
    return out;
  }

  // ── donation planning (Feature 7) ──────────────────────────
  function donations(d) {
    return replenishment(d)
      .filter(function (r) { return r.suggest > 0; })
      .sort(function (a, b) { return a.days - b.days; });
  }

  // ── executive summary (Feature 9) ──────────────────────────
  function execSummary(d) {
    const since = Storage.today(-30);
    const dists = (d.dists || []).filter(function (r) { return (r.date || '') >= since; });
    const families = dists.reduce(function (s, r) { return s + _num(r.familiesServed); }, 0);
    const volHrs = dists.reduce(function (s, r) { return s + _num(r.volunteerHours); }, 0);
    let boxes = 0, consumed = 0;
    (d.builds || []).forEach(function (b) { if ((b.date || '') >= since) { boxes += _num(b.quantity); (b.itemsConsumed || []).forEach(function (c) { consumed += _num(c.qty); }); } });
    (d.orders || []).forEach(function (o) {
      if ((o.status === 'Distributed' || o.status === 'Completed') && (o.completedAt || '').slice(0, 10) >= since) {
        boxes += _num(o.quantity);
        (o.itemsConsumed || []).forEach(function (c) { consumed += _num(c.qty); });
      }
    });
    let donated = 0;
    (d.inv || []).forEach(function (i) { if ((i.dateReceived || '') >= since) donated += _num(i.qty); });
    const need = donations(d).slice(0, 5);
    const shortages = replenishment(d).filter(function (r) { return r.zone === 'red'; }).sort(function (a, b) { return a.days - b.days; });
    return { families: families, boxes: boxes, volHrs: volHrs, consumed: consumed, donated: donated, need: need, shortages: shortages };
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  function _zoneBadge(zone) {
    if (zone === 'green')  return '<span class="badge badge-success">90+ days</span>';
    if (zone === 'yellow') return '<span class="badge badge-warning">30–90 days</span>';
    return '<span class="badge badge-danger">&lt; 30 days</span>';
  }
  function _daysLabel(days) {
    if (days === Infinity) return '<span style="color:var(--text-muted)">Stable</span>';
    return days + ' days';
  }
  function _depletion(onHand, monthly) {
    if (monthly <= 0) return '<span style="color:var(--text-muted)">—</span>';
    const days = onHand / (monthly / 30);
    if (days > 720) return '<span style="color:var(--text-muted)">2+ yrs</span>';
    return _monYear(_addDays(days));
  }

  function renderPlanning() {
    const d = data();
    const colorMap = { blue: 'var(--accent)', green: 'var(--green)', orange: 'var(--orange)', purple: '#8b5cf6', red: 'var(--red)' };

    if (!d.inv.length && !d.templates.length) {
      return '<div class="empty-state" style="padding:50px 20px;"><div class="empty-state__icon"><i data-lucide="line-chart" aria-hidden="true"></i></div>'
        + '<div class="empty-state__title">No data to plan with yet</div>'
        + '<div class="empty-state__body">Add inventory items and box templates, then this tab forecasts capacity, consumption, and donation needs.</div></div>';
    }

    const r = readiness(d);
    const hs = healthScore(d);
    const cons = consumptionByItem(d);
    const repl = replenishment(d);
    const opt = optimizer(d);
    const reds = repl.filter(function (x) { return x.zone === 'red'; });
    const subs = subSuggestions(d, reds.map(function (x) { return x.item.name; }).concat(r.perTemplate.map(function (p) { return p.limiting; }).filter(Boolean)));

    // Average days between distributions (for per-distribution rate)
    const distsSorted = (d.dists || []).filter(function (r) { return r.date; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    const avgDistDays = distsSorted.length >= 2
      ? Math.round(_daysBetween(distsSorted[0].date, distsSorted[distsSorted.length - 1].date) / (distsSorted.length - 1))
      : 14;

    let html = '<div class="flex-between" style="margin-bottom:18px;flex-wrap:wrap;gap:10px;">'
      + '<div><div style="font-weight:700;font-size:.95rem;">Resource Planning (FPRP)</div>'
      + '<div class="text-meta">Live forecasting from inventory, recipes, and build history · Based on ' + cons.actualDays + ' days of history</div></div></div>';

    /* ── Feature 8: Pantry Health Score + Feature 4 readiness KPIs ── */
    const hsColor = hs.score >= 85 ? 'var(--success)' : hs.score >= 70 ? 'var(--warning)' : 'var(--danger)';
    const hsStatus = hs.score >= 85 ? 'Healthy' : hs.score >= 70 ? 'Stable — watch' : 'At Risk';
    html += '<div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,' + hsColor + '14,transparent);">'
      + '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">'
      + '<div style="text-align:center;min-width:120px;">'
      + '<div style="font-size:2.6rem;font-weight:800;line-height:1;color:' + hsColor + '">' + hs.score + '</div>'
      + '<div class="text-meta">Pantry Health / 100</div>'
      + '<div style="font-weight:700;color:' + hsColor + ';margin-top:4px;">' + hsStatus + '</div></div>'
      + '<div style="flex:1;min-width:240px;">'
      + hs.factors.map(function (f) {
          const pct = Math.round(f.val * 100);
          const col = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
          return '<div class="ministry-health-item" style="margin-bottom:6px;"><div class="ministry-health-label"><span>' + f.label + '</span><span style="color:' + col + '">' + pct + '%</span></div>'
            + '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + pct + '%;background:' + col + '"></div></div></div>';
        }).join('')
      + '</div></div>'
      + '<div style="margin-top:12px;font-size:.84rem;"><strong>Primary risk:</strong> ' + hs.primaryRisk.label + ' (' + Math.round(hs.primaryRisk.val * 100) + '%)</div>'
      + '</div>';

    /* ── 45-day history gate ── */
    if (cons.actualDays < 45) {
      html += '<div class="card" style="margin-bottom:20px;border-left:4px solid var(--warning);">'
        + '<div style="display:flex;gap:12px;align-items:flex-start;">'
        + '<i data-lucide="clock" class="icon-inline" style="color:var(--warning);flex-shrink:0;margin-top:2px;" aria-hidden="true"></i>'
        + '<div><div style="font-weight:700;margin-bottom:4px;">Not enough history for forecasts</div>'
        + '<div class="text-meta">Forecasting requires at least 45 days of distribution data. '
        + (cons.actualDays > 0 ? 'Based on ' + cons.actualDays + ' days so far — ' + (45 - cons.actualDays) + ' more days needed.' : 'Complete some distributions to start tracking.')
        + '</div></div></div></div>';
      return html;
    }

    /* ── Feature 4: Distribution Readiness ── */
    html += '<div class="section-label-sm">Distribution Readiness</div>';
    html += '<div class="kpi-grid kpi-grid--sm">'
      + _stat('blue', r.score + '%', 'Readiness Score', 'vs projected demand')
      + _stat('green', (d.dists.length ? _num(d.dists[d.dists.length - 1].familiesServed) : 0), 'Families Last Distribution', '')
      + _stat('purple', r.proj, 'Projected Families Next', '3-distribution average')
      + (function () { var t = r.perTemplate.reduce(function (a, b) { return b.maxBuild > a.maxBuild ? b : a; }, { maxBuild: 0, name: '—' }); return _stat('orange', t.maxBuild, 'Top Box Capacity', UI.esc(t.name) + ' — most buildable'); })()
      + '</div>';
    html += '<div class="card" style="margin-bottom:20px;"><div class="card-header"><h3 class="card-title">Current Inventory Supports</h3></div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">'
      + r.perTemplate.map(function (p) {
          const acc = colorMap[p.color] || 'var(--accent)';
          const cov = Math.min(100, Math.round((p.maxBuild / (r.proj || 1)) * 100));
          const col = cov >= 90 ? 'var(--success)' : cov >= 50 ? 'var(--warning)' : 'var(--danger)';
          return '<div style="border:1px solid var(--border);border-top:3px solid ' + acc + ';border-radius:var(--radius);padding:12px;">'
            + '<div style="font-size:1.6rem;font-weight:800;line-height:1;">' + p.maxBuild + '</div>'
            + '<div style="font-weight:600;font-size:.86rem;">' + UI.esc(p.name) + '</div>'
            + '<div class="progress-bar-track" style="margin:8px 0 4px;"><div class="progress-bar-fill" style="width:' + cov + '%;background:' + col + '"></div></div>'
            + '<div class="text-meta">' + cov + '% of next distribution</div></div>';
        }).join('')
      + '</div></div>';

    /* ── Feature 1: Box Build Capacity Analysis ── */
    html += '<div class="section-label-sm">Box Build Capacity</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:20px;">'
      + d.templates.map(function (t) {
          const c = capacity(t, d.inv);
          const acc = colorMap[t.color] || 'var(--accent)';
          const hcol = c.health >= 80 ? 'var(--success)' : c.health >= 50 ? 'var(--warning)' : 'var(--danger)';
          return '<div class="card" style="border-top:3px solid ' + acc + ';">'
            + '<div style="font-weight:700;font-size:.95rem;margin-bottom:2px;">' + UI.esc(t.name) + '</div>'
            + '<div style="font-size:1.4rem;font-weight:800;color:' + acc + ';">' + c.maxBuild + ' <span style="font-size:.8rem;font-weight:600;color:var(--text-muted)">boxes buildable</span></div>'
            + '<div style="font-size:.84rem;margin:6px 0;">Limiting item: <strong>' + UI.esc(c.limiting || '—') + '</strong></div>'
            + '<div class="ministry-health-label"><span class="text-meta">Stock balance</span><span style="color:' + hcol + '">' + c.health + '%</span></div>'
            + '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + c.health + '%;background:' + hcol + '"></div></div></div>';
        }).join('')
      + '</div>';

    /* ── Feature 2: Inventory Consumption ── */
    const cRows = Object.keys(cons.map).map(function (k) { const m = cons.map[k]; m.name = k; return m; })
      .sort(function (a, b) { return b.monthly - a.monthly; });
    html += '<div class="section-label-sm">Inventory Consumption</div>';
    if (cRows.length) {
      const fastest = cRows[0], slowest = cRows[cRows.length - 1];
      html += '<div class="kpi-grid kpi-grid--sm">'
        + _stat('red', UI.esc(fastest.name), 'Fastest Consumed', _round(fastest.monthly) + ' ' + UI.esc(fastest.unit) + '/mo')
        + _stat('green', UI.esc(slowest.name), 'Slowest Consumed', _round(slowest.monthly) + ' ' + UI.esc(slowest.unit) + '/mo')
        + '</div>';
      html += '<div id="fprp-cons-wrap" style="margin-bottom:20px;"></div>';
    } else {
      html += '<div class="card" style="margin-bottom:20px;"><div class="text-meta">No consumption history yet — complete some box orders or builds and usage rates will appear here.</div></div>';
    }

    /* ── Feature 3: Replenishment Planner ── */
    const before = repl.filter(function (x) { return x.zone === 'red'; }).sort(function (a, b) { return a.days - b.days; });
    const yellow = repl.filter(function (x) { return x.zone === 'yellow'; }).sort(function (a, b) { return a.days - b.days; });
    html += '<div class="section-label-sm">Replenishment Planner</div>';
    html += '<div class="kpi-grid kpi-grid--sm">'
      + _stat('red', before.length, 'Needed Before Next Distribution', '< 30 days supply')
      + _stat('yellow', yellow.length, 'Needed Within 60–90 Days', '30–90 days supply')
      + _stat('green', repl.filter(function (x) { return x.zone === 'green'; }).length, 'Well Stocked', '90+ days supply')
      + '</div>';
    const planRows = repl.filter(function (x) { return x.suggest > 0; }).sort(function (a, b) { return a.days - b.days; });
    html += '<div id="fprp-repl-wrap" style="margin-bottom:20px;"></div>';

    /* ── Feature 5: Substitute Item Engine ── */
    html += '<div class="flex-between" style="margin-bottom:8px;"><div class="section-label-sm" style="margin:0;">Substitution Engine</div>'
      + '<button class="btn btn-outline btn-sm" onclick="FPRP.addSubstitution()"><i data-lucide="plus" class="icon-xs" aria-hidden="true"></i> Add Rule</button></div>';
    html += '<div class="card" style="margin-bottom:20px;">';
    if (subs.length) {
      html += '<div style="margin-bottom:12px;">';
      subs.forEach(function (s) {
        const ok = s.available > 0;
        html += '<div class="alert-banner ' + (ok ? 'alert-banner-blue' : 'alert-banner-yellow') + '" style="margin-bottom:6px;">'
          + '<i data-lucide="' + (ok ? 'replace' : 'alert-triangle') + '" class="icon-sm" aria-hidden="true"></i>'
          + '<span><strong>' + UI.esc(s.from) + '</strong> running short — '
          + (ok ? 'substitute <strong>' + UI.esc(s.to) + '</strong> (' + s.available + ' available, ' + s.ratio + ')' : 'suggested sub <strong>' + UI.esc(s.to) + '</strong> is also out')
          + (s.note ? ' · ' + UI.esc(s.note) : '') + '</span></div>';
      });
      html += '</div>';
    } else {
      html += '<div class="text-meta" style="margin-bottom:10px;">No active shortages need substitution right now. Rules below apply automatically when items run low.</div>';
    }
    // rules table
    if (d.subs.length) {
      html += '<div id="fprp-subs-wrap"></div>';
    }
    html += '</div>';

    /* ── Feature 6: Template Optimizer ── */
    if (opt) {
      html += '<div class="section-label-sm">Template Optimizer</div>';
      html += '<div class="kpi-grid kpi-grid--sm">'
        + _stat('purple', UI.esc(opt.mostExpensive.t.name), 'Most Comprehensive Box', opt.mostExpensive.weight + ' items per family')
        + _stat('green', UI.esc(opt.lowestRisk.t.name), 'Lowest Inventory Risk', opt.lowestRisk.cap.maxBuild + ' buildable')
        + _stat('blue', UI.esc(opt.highestDemand.t.name), 'Highest Demand', opt.highestDemand.demand + ' built to date')
        + _stat('orange', UI.esc(opt.mostSustainable.t.name), 'Most Sustainable', opt.mostSustainable.cap.maxBuild + ' w/o restock')
        + '</div>';
      // recommendations
      let recs = '';
      opt.rows.forEach(function (row) {
        if (row.cap.maxBuild === 0) {
          recs += '<li><strong>' + UI.esc(row.t.name) + '</strong> cannot be built — out of <strong>' + UI.esc(row.cap.limiting || 'a key item') + '</strong>.</li>';
        } else if (row.demand > 0 && row.cap.maxBuild > row.demand * 1.4) {
          recs += '<li><strong>' + UI.esc(row.t.name) + '</strong> can be increased by ~' + Math.round((row.cap.maxBuild / Math.max(1, row.demand) - 1) * 100) + '% using current stock.</li>';
        } else if (row.cap.health < 50) {
          recs += '<li><strong>' + UI.esc(row.t.name) + '</strong> is limited by <strong>' + UI.esc(row.cap.limiting || '') + '</strong> — unbalanced stock.</li>';
        }
      });
      html += '<div class="card" style="margin-bottom:20px;"><div class="card-header"><h3 class="card-title">Recommendations</h3></div>'
        + (recs ? '<ul style="margin:0;padding-left:18px;font-size:.86rem;line-height:1.9;list-style:disc;">' + recs + '</ul>' : '<div class="text-meta">All templates are well balanced against current demand.</div>')
        + '</div>';
    }

    /* ── Feature 7: Donation Planning ── */
    const need = donations(d).slice(0, 10);
    html += '<div class="flex-between" style="margin-bottom:8px;"><div class="section-label-sm" style="margin:0;">Donation Planning</div>'
      + '<button class="btn btn-outline btn-sm" onclick="FPRP.printDonationList()"><i data-lucide="printer" class="icon-xs" aria-hidden="true"></i> Print Request List</button></div>';
    html += '<div class="card" style="margin-bottom:20px;"><div class="card-header"><h3 class="card-title">Top Needed Donations</h3>'
      + '<span class="text-meta">Ranked by urgency &amp; consumption</span></div>';
    html += '<div id="fprp-donation-wrap"></div>';
    html += '</div>';

    /* ── Feature 9: Executive Reporting ── */
    const ex = execSummary(d);
    html += '<div class="flex-between" style="margin-bottom:8px;"><div class="section-label-sm" style="margin:0;">Executive Summary — Last 30 Days</div>'
      + '<button class="btn btn-outline btn-sm" onclick="FPRP.printExecReport()"><i data-lucide="file-text" class="icon-xs" aria-hidden="true"></i> Print Report</button></div>';
    html += '<div class="kpi-grid kpi-grid--sm">'
      + _stat('green', ex.families, 'Families Served', '')
      + _stat('blue', ex.boxes, 'Boxes Distributed', '')
      + _stat('orange', ex.volHrs, 'Volunteer Hours', '')
      + _stat('purple', _round(ex.consumed), 'Items Consumed', '')
      + _stat('yellow', _round(ex.donated), 'Items Donated In', '')
      + '</div>';
    html += '<div class="card"><div class="card-header"><h3 class="card-title">Leadership Snapshot</h3></div>'
      + '<div style="font-size:.86rem;line-height:1.8;">'
      + '<strong>Most needed items:</strong> ' + (ex.need.length ? ex.need.map(function (n) { return UI.esc(n.item.name); }).join(', ') : '—') + '<br>'
      + '<strong>Forecasted shortages:</strong> ' + (ex.shortages.length ? ex.shortages.map(function (s) { return UI.esc(s.item.name) + ' (' + _daysLabel(s.days) + ')'; }).join(', ') : 'None projected') + '<br>'
      + '<strong>Pantry health:</strong> ' + hs.score + '/100 — ' + hsStatus
      + '</div></div>';

    _pd = { cRows: cRows, avgDistDays: avgDistDays, planRows: planRows, d: d, need: need };
    return html;
  }

  // ── Post-render: populate UI.table() placeholders ─────────────
  var _pd = null;
  function postRender() {
    if (!_pd) return;
    var cr = _pd.cRows, avd = _pd.avgDistDays, pr = _pd.planRows, dd = _pd.d, nd = _pd.need;

    // Consumption table
    if (document.getElementById('fprp-cons-wrap')) {
      UI.table({
        wrap: 'fprp-cons-wrap',
        cols: [
          { key: 'name',      label: 'Item',             fmt: function(v) { return '<strong>' + UI.esc(v) + '</strong>'; } },
          { key: 'onHand',    label: 'On Hand',          fmt: function(v, r) { return v + ' ' + UI.esc(r.unit); } },
          { key: '_perDist',  label: 'Per Distribution' },
          { key: '_monthly',  label: 'Monthly Use' },
          { key: 'trend',     label: 'Trend',            fmt: function(v) {
              return v === 'up' ? '<span style="color:var(--danger)">▲</span>'
                   : v === 'down' ? '<span style="color:var(--success)">▼</span>'
                   : '<span style="color:var(--text-muted)">▬</span>';
          }},
          { key: '_depletion', label: 'Est. Stockout', hideOnMobile: true },
        ],
        rows: cr.map(function(m) {
          var pd = m.monthly * (avd / 30);
          return Object.assign({}, m, {
            _perDist:   (pd >= 0.1 ? pd.toFixed(1) : '0') + ' / dist',
            _monthly:   (m.monthly >= 0.1 ? m.monthly.toFixed(1) : '0') + ' / mo',
            _depletion: _depletion(m.onHand, m.monthly),
          });
        }),
        empty: { icon: 'package', title: 'No consumption history yet', text: 'Complete some box orders or builds.' },
      });
    }

    // Replenishment table
    if (document.getElementById('fprp-repl-wrap')) {
      if (pr.length) {
        UI.table({
          wrap: 'fprp-repl-wrap',
          cols: [
            { key: 'item',    label: 'Item',            fmt: function(v) { return '<strong>' + UI.esc(v.name) + '</strong>'; } },
            { key: '_onHand', label: 'On Hand' },
            { key: 'days',    label: 'Supply',          fmt: function(v) { return _daysLabel(v); } },
            { key: 'zone',    label: 'Status',          fmt: function(v) { return _zoneBadge(v); } },
            { key: '_order',  label: 'Suggested Order', fmt: function(v) { return '<strong style="color:var(--accent)">' + v + '</strong>'; } },
          ],
          rows: pr.map(function(x) {
            return Object.assign({}, x, {
              _onHand: x.item.qty + ' ' + UI.esc(x.item.unit),
              _order:  '+' + x.suggest + ' ' + UI.esc(x.item.unit),
            });
          }),
          empty: { icon: 'check-circle', title: 'Everything stocked to 90-day target', text: '' },
        });
      } else {
        document.getElementById('fprp-repl-wrap').innerHTML =
          '<div class="card" style="margin-bottom:20px;"><div class="text-meta">Everything is stocked to a 90-day target. <i data-lucide="party-popper" class="icon-inline" aria-hidden="true"></i></div></div>';
      }
    }

    // Substitution rules table
    if (document.getElementById('fprp-subs-wrap')) {
      UI.table({
        wrap: 'fprp-subs-wrap',
        cols: [
          { key: '_from', label: 'If short' },
          { key: '_arr',  label: '' },
          { key: '_to',   label: 'Substitute' },
          { key: 'note',  label: 'Note', tdClass: 'text-meta', fmt: function(v) { return UI.esc(v || ''); } },
        ],
        rows: dd.subs.map(function(s) {
          return Object.assign({}, s, {
            _from: (s.fromQty || 1) + ' × ' + UI.esc(s.fromItem),
            _arr:  '→',
            _to:   (s.toQty || 1) + ' × ' + UI.esc(s.toItem),
          });
        }),
        empty: { icon: 'replace', title: 'No substitution rules', text: '' },
        actions: function(r) {
          return '<button class="btn btn-ghost btn-sm text-danger" aria-label="Remove rule" onclick="FPRP.removeSubstitution(\'' + r.id + '\')"><i data-lucide="x" class="icon-xs" aria-hidden="true"></i></button>';
        },
      });
    }

    // Donation table
    if (document.getElementById('fprp-donation-wrap')) {
      if (nd.length) {
        UI.table({
          wrap: 'fprp-donation-wrap',
          cols: [
            { key: '_rank',   label: '#',        fmt: function(v) { return '<strong style="color:var(--accent)">' + v + '</strong>'; } },
            { key: 'item',    label: 'Item',      fmt: function(v) { return '<strong>' + UI.esc(v.name) + '</strong>'; } },
            { key: 'zone',    label: 'Status',    fmt: function(v) { return _zoneBadge(v); } },
            { key: 'days',    label: 'Supply',    fmt: function(v) { return _daysLabel(v); } },
            { key: '_req',    label: 'Requested', fmt: function(v) { return '<strong>' + v + '</strong>'; } },
          ],
          rows: nd.map(function(x, i) {
            return Object.assign({}, x, { _rank: i + 1, _req: '+' + x.suggest + ' ' + UI.esc(x.item.unit) });
          }),
          empty: { icon: 'heart', title: 'No urgent donation needs right now', text: '' },
        });
      } else {
        document.getElementById('fprp-donation-wrap').innerHTML = '<div class="text-meta">No urgent donation needs right now.</div>';
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  var _accentMap = { red: 'danger', green: 'success', blue: 'brand', orange: 'warning', yellow: 'warning', purple: 'info' };
  function _stat(color, value, label, meta) {
    return UI.kpi({ value: value, label: label, meta: meta || '', accent: _accentMap[color] || 'brand', sm: true });
  }

  // ── Substitution rule CRUD ─────────────────────────────────
  function addSubstitution() {
    const inv = Storage.getAll('pantry_inventory') || [];
    const names = Array.from(new Set(inv.map(function (i) { return i.name; }))).sort();
    const dl = '<datalist id="sub-items">' + names.map(function (n) { return '<option value="' + UI.esc(n) + '">'; }).join('') + '</datalist>';
    const body = dl
      + '<div class="form-row"><div class="form-group"><label class="form-label">When short of *</label><input class="form-control" id="sub-from" list="sub-items" placeholder="Item name..."></div>'
      + '<div class="form-group"><label class="form-label">Qty</label><input class="form-control" id="sub-fromqty" type="number" min="1" value="1"></div></div>'
      + '<div class="form-row"><div class="form-group"><label class="form-label">Substitute with *</label><input class="form-control" id="sub-to" list="sub-items" placeholder="Item name..."></div>'
      + '<div class="form-group"><label class="form-label">Qty</label><input class="form-control" id="sub-toqty" type="number" min="1" value="1"></div></div>'
      + '<div class="form-group"><label class="form-label">Note</label><input class="form-control" id="sub-note" placeholder="e.g. protein swap"></div>';
    Modal.open({ title: 'Add Substitution Rule', body: body, width: '480px',
      footer: '<button class="btn btn-outline" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="sub-save">Add Rule</button>' });
    document.getElementById('sub-save').onclick = function () {
      const from = (document.getElementById('sub-from').value || '').trim();
      const to = (document.getElementById('sub-to').value || '').trim();
      if (!from || !to) { Toast.error('Both items are required'); return; }
      const rec = Storage.insert('pantry_substitutions', {
        fromItem: from, fromQty: parseFloat(document.getElementById('sub-fromqty').value) || 1,
        toItem: to, toQty: parseFloat(document.getElementById('sub-toqty').value) || 1,
        note: (document.getElementById('sub-note').value || '').trim(),
      });
      _writeThrough('pantry_substitutions', rec);
      Modal.close(); Toast.success('Rule added'); _goto();
    };
  }

  function removeSubstitution(id) {
    Storage.removeItem('pantry_substitutions', id);
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isAuthenticated()) SupabaseDB.tableDelete('pantry_substitutions', id).catch(function () {});
    Toast.success('Rule removed'); _goto();
  }

  // ── Printables ─────────────────────────────────────────────
  function _printWindow(title, inner) {
    const s = Storage.getSettings ? Storage.getSettings() : {};
    const head = '<h1 style="font-size:20px;margin:0 0 2px;">' + (s.churchName || 'Church Food Pantry') + '</h1>'
      + '<div style="color:#555;font-size:13px;margin-bottom:16px;">' + title + ' · ' + new Date().toLocaleDateString() + '</div>';
    const w = window.open('', '_blank');
    if (!w) { Toast.error('Allow pop-ups to print'); return; }
    w.document.write('<html><head><title>' + title + '</title><style>'
      + 'body{font-family:-apple-system,Segoe UI,sans-serif;color:#111;padding:32px;}'
      + 'table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}'
      + 'th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #ddd;}'
      + 'th{background:#f4f4f4;text-transform:uppercase;font-size:11px;letter-spacing:.04em;}'
      + 'h2{font-size:15px;margin:18px 0 4px;}</style></head><body>' + head + inner
      + '<div style="margin-top:24px;color:#888;font-size:11px;">Generated by the Food Pantry Resource Planning system.</div>'
      + '</body></html>');
    w.document.close(); w.focus();
    setTimeout(function () { w.print(); }, 250);
  }

  function printDonationList() {
    const d = data();
    const need = donations(d);
    let rows = '<table><thead><tr><th>#</th><th>Item</th><th>Current Stock</th><th>Suggested Donation</th><th>Priority</th></tr></thead><tbody>';
    if (!need.length) rows += '<tr><td colspan="5">No urgent needs at this time — thank you!</td></tr>';
    need.forEach(function (x, i) {
      const pri = x.zone === 'red' ? 'URGENT' : x.zone === 'yellow' ? 'Soon' : 'Stock up';
      rows += '<tr><td>' + (i + 1) + '</td><td>' + UI.esc(x.item.name) + '</td><td>' + x.item.qty + ' ' + UI.esc(x.item.unit) + '</td><td><strong>' + x.suggest + ' ' + UI.esc(x.item.unit) + '</strong></td><td>' + pri + '</td></tr>';
    });
    rows += '</tbody></table>';
    _printWindow('Donation Request List', '<h2>Most Needed Items</h2>' + rows);
  }

  function printExecReport() {
    const d = data();
    const ex = execSummary(d);
    const hs = healthScore(d);
    const r = readiness(d);
    let html = '<h2>Monthly Summary (last 30 days)</h2><table><tbody>'
      + '<tr><th>Families Served</th><td>' + ex.families + '</td></tr>'
      + '<tr><th>Boxes Distributed</th><td>' + ex.boxes + '</td></tr>'
      + '<tr><th>Volunteer Hours</th><td>' + ex.volHrs + '</td></tr>'
      + '<tr><th>Items Consumed</th><td>' + _round(ex.consumed) + '</td></tr>'
      + '<tr><th>Items Donated In</th><td>' + _round(ex.donated) + '</td></tr>'
      + '<tr><th>Pantry Health Score</th><td>' + hs.score + ' / 100 (' + (hs.score >= 85 ? 'Healthy' : hs.score >= 70 ? 'Stable' : 'At Risk') + ')</td></tr>'
      + '<tr><th>Readiness Score</th><td>' + r.score + '%</td></tr>'
      + '</tbody></table>';
    _printWindow('Pantry Executive Report', html);
  }

  return {
    healthScore:        healthScore,
    consumptionByItem:  consumptionByItem,
    replenishment:      replenishment,
    readiness:          readiness,
    pantrySnapshot:     pantrySnapshot,
    optimizer:          optimizer,
    subSuggestions:     subSuggestions,
    execSummary:        execSummary,
    donations:          donations,
    renderPlanning:     renderPlanning,
    postRender:         postRender,
    printDonationList:  printDonationList,
    printExecReport:    printExecReport,
    addSubstitution:    addSubstitution,
    removeSubstitution: removeSubstitution,
  };
})();
