/* =============================================================
   prompts.js  —  Message Templates
   Pre-written messages for common church communications.
   ============================================================= */

Navigation.register('prompts', function render(page) {
  const s          = Storage.getSettings();
  const church     = s.churchName  || 'Our Church';
  const pastor     = s.pastorName  || 'Pastor';
  const phone      = s.phone       || '[church phone]';
  const website    = s.website     || '[church website]';
  const address    = s.address     || '[church address]';
  const serviceTime = s.serviceTime || 'Sunday at 10:00 AM';

  const categories = [
    {
      id: 'visitor',
      label: 'Visitor Follow-Up',
      icon: 'hand-shake',
      templates: [
        {
          title: 'First-Time Visitor — Text',
          tags: ['text', 'visitor'],
          body: `Hi [NAME], it was so great having you with us at ${church} this past Sunday! We hope you felt welcomed. If you have any questions or would like to get more connected, feel free to reach out anytime. We'd love to see you again! — ${pastor}`,
        },
        {
          title: 'First-Time Visitor — Email',
          tags: ['email', 'visitor'],
          body: `Subject: So glad you joined us at ${church}!\n\nDear [NAME],\n\nThank you so much for worshipping with us this past Sunday. It was a joy to have you, and we hope you felt at home.\n\nAt ${church}, our heart is to be a place where everyone belongs. Whether you're exploring faith for the first time or looking for a church home, we'd love to walk that journey with you.\n\nHere are a few ways to get connected:\n• Sunday Services: ${serviceTime} | ${address}\n• Website: ${website}\n• Phone: ${phone}\n\nWe'd love to learn more about you. Feel free to reply to this email or give us a call anytime.\n\nWith warm welcome,\n${pastor}\n${church}`,
        },
        {
          title: 'Second Visit Follow-Up — Text',
          tags: ['text', 'visitor'],
          body: `Hi [NAME]! It's great to see you back at ${church}. We just wanted to say how much it means to us. If you'd ever like to grab coffee and hear more about what we're doing, we'd love that! — ${pastor}`,
        },
        {
          title: 'New Member Welcome — Email',
          tags: ['email', 'visitor', 'members'],
          body: `Subject: Welcome to the ${church} family!\n\nDear [NAME],\n\nOn behalf of everyone at ${church}, welcome! We are so thrilled to have you officially join our church family.\n\nHere are your next steps:\n• Connect with a small group — ask us for recommendations\n• Explore ministry opportunities that match your gifts\n• Join us at ${serviceTime} each week\n\nOur door is always open. Please don't hesitate to reach out with any questions.\n\nBlessings,\n${pastor}\n${church}\n${phone} | ${website}`,
        },
      ],
    },
    {
      id: 'volunteer',
      label: 'Volunteer Messages',
      icon: 'users',
      templates: [
        {
          title: 'Volunteer Recruitment — Text',
          tags: ['text', 'volunteer'],
          body: `Hi [NAME]! We're looking for volunteers to help with [MINISTRY AREA] at ${church}. It's a great way to serve and get connected. Interested? Reply here or contact us at ${phone}. Thank you! — ${pastor}`,
        },
        {
          title: 'Volunteer Recruitment — Email',
          tags: ['email', 'volunteer'],
          body: `Subject: Would you like to serve with us at ${church}?\n\nDear [NAME],\n\nWe believe everyone has gifts to share, and we would love to have you serve alongside us at ${church}!\n\nWe currently have openings in:\n• [MINISTRY AREA 1]\n• [MINISTRY AREA 2]\n• [MINISTRY AREA 3]\n\nNo experience necessary — just a willing heart. Commitment is [TIME COMMITMENT] and we provide all training needed.\n\nInterested? Reply to this email or call us at ${phone}. We'd love to chat!\n\nIn service together,\n${pastor}\n${church}`,
        },
        {
          title: 'Volunteer Appreciation — Text',
          tags: ['text', 'volunteer'],
          body: `Hi [NAME]! We just wanted to take a moment to say THANK YOU for everything you do for ${church}. Your service in [MINISTRY AREA] makes such a difference. We are so grateful for you!`,
        },
        {
          title: 'Volunteer Appreciation — Email',
          tags: ['email', 'volunteer'],
          body: `Subject: Thank you for your faithful service!\n\nDear [NAME],\n\nWe want to take a moment to express our heartfelt gratitude for your dedication and service to ${church}.\n\nYour work in [MINISTRY AREA] does not go unnoticed. Because of volunteers like you, we are able to [SPECIFIC IMPACT]. You are a true blessing to this church family.\n\nThank you for giving your time and talent so generously. We are deeply grateful.\n\nWith appreciation,\n${pastor} and the ${church} family`,
        },
        {
          title: 'Background Check Reminder — Text',
          tags: ['text', 'volunteer'],
          body: `Hi [NAME], just a friendly reminder that your background check for volunteering at ${church} is still pending. Please complete it at [LINK] or call us at ${phone} if you have any questions. Thank you!`,
        },
      ],
    },
    {
      id: 'care',
      label: 'Care & Prayer',
      icon: 'heart-handshake',
      templates: [
        {
          title: 'Sympathy — Text',
          tags: ['text', 'care'],
          body: `Hi [NAME], we heard about your loss and wanted you to know that our whole ${church} family is praying for you and your family. Please don't hesitate to reach out if there is anything we can do. You are loved. — ${pastor}`,
        },
        {
          title: 'Sympathy — Email',
          tags: ['email', 'care'],
          body: `Subject: Our thoughts and prayers are with you\n\nDear [NAME],\n\nWe were deeply saddened to hear about the passing of [LOVED ONE'S NAME]. Please know that you and your entire family are in our prayers during this difficult time.\n\nGrief is a heavy burden, and you don't have to carry it alone. Our church family is here for you — whether that means a meal, a visit, or simply someone to talk to.\n\nPlease don't hesitate to reach out at any time. We love you and are here for you.\n\nWith deepest sympathy,\n${pastor}\n${church}\n${phone}`,
        },
        {
          title: 'Hospital / Illness Check-In — Text',
          tags: ['text', 'care'],
          body: `Hi [NAME], we heard you've been under the weather and wanted to check in. We're praying for a speedy recovery! If there's anything we can do — meals, a visit, or anything at all — please don't hesitate to ask. You are in our prayers. — ${church}`,
        },
        {
          title: 'Prayer Request Acknowledgment — Text',
          tags: ['text', 'care', 'prayer'],
          body: `Hi [NAME], thank you for trusting us with your prayer request. Our prayer team is lifting you up. We believe God hears every prayer. If there's anything else we can do, we're here for you. — ${church}`,
        },
        {
          title: 'Answered Prayer Celebration — Text',
          tags: ['text', 'care', 'prayer'],
          body: `Hi [NAME]! We just heard the wonderful news about [ANSWERED PRAYER]. Praise God! We rejoice with you and are so grateful for His faithfulness. What a blessing! — ${pastor} & ${church}`,
        },
      ],
    },
    {
      id: 'events',
      label: 'Event Announcements',
      icon: 'calendar',
      templates: [
        {
          title: 'Event Invitation — Text',
          tags: ['text', 'events'],
          body: `Hi [NAME]! We'd love to have you join us for [EVENT NAME] at ${church} on [DATE] at [TIME]. [ONE SENTENCE ABOUT EVENT]. Hope to see you there! Questions? Call ${phone}.`,
        },
        {
          title: 'Event Invitation — Email',
          tags: ['email', 'events'],
          body: `Subject: You're invited — [EVENT NAME] at ${church}!\n\nDear [NAME],\n\nWe would love to have you join us for [EVENT NAME]!\n\nDate: [DATE]\nTime: [TIME]\nLocation: [LOCATION / ${address}]\n\n[2-3 SENTENCES DESCRIBING THE EVENT AND WHY THEY SHOULD COME]\n\nThis event is free and open to everyone. Feel free to bring a friend!\n\nRSVP by [RSVP DATE] by replying to this email or calling us at ${phone}.\n\nWe hope to see you there!\n\nBlessings,\n${pastor}\n${church}\n${website}`,
        },
        {
          title: 'Event Reminder — Text',
          tags: ['text', 'events'],
          body: `Just a reminder that [EVENT NAME] is happening [TOMORROW / THIS SUNDAY] at [TIME] at ${church}! We can't wait to see you there. Any questions? Reply or call ${phone}.`,
        },
        {
          title: 'Event Recap & Thank You — Text',
          tags: ['text', 'events'],
          body: `What an amazing [EVENT NAME] we had! Thank you so much for being part of it. [ONE SENTENCE HIGHLIGHT]. We are so grateful for everyone who came out. God bless! — ${church}`,
        },
      ],
    },
    {
      id: 'giving',
      label: 'Stewardship & Giving',
      icon: 'heart',
      templates: [
        {
          title: 'Year-End Giving Reminder — Email',
          tags: ['email', 'giving'],
          body: `Subject: Year-end giving reminder from ${church}\n\nDear [NAME],\n\nAs the year comes to a close, we want to say thank you for your faithful generosity to ${church}. Your giving makes everything we do possible.\n\nAs a reminder, all donations made by December 31st are tax-deductible for this calendar year.\n\nWays to give:\n• Online: ${website}\n• In person: ${address}\n• By mail: [MAILING ADDRESS]\n\nA giving statement for your records will be mailed in January. Thank you for partnering with us in ministry!\n\nWith gratitude,\n${pastor}\n${church}`,
        },
        {
          title: 'Giving Thank You — Text',
          tags: ['text', 'giving'],
          body: `Hi [NAME], thank you so much for your generous gift to ${church}! Your support makes a real difference in our community. We are truly grateful. God bless you! — ${pastor}`,
        },
        {
          title: 'New Giving Opportunity — Email',
          tags: ['email', 'giving'],
          body: `Subject: A special opportunity to give at ${church}\n\nDear [NAME],\n\nWe have a special opportunity we wanted to share with you.\n\n[DESCRIBE THE GIVING NEED OR PROJECT — e.g., building fund, missions trip, benevolence fund]\n\nOur goal is to raise $[AMOUNT] by [DATE]. Every gift, no matter the size, brings us closer to that goal.\n\nTo give, visit ${website} or contact us at ${phone}. Thank you for prayerfully considering this opportunity.\n\nIn His service,\n${pastor}\n${church}`,
        },
      ],
    },
    {
      id: 'general',
      label: 'General Communication',
      icon: 'message-square',
      templates: [
        {
          title: 'Sunday Service Reminder — Text',
          tags: ['text', 'general'],
          body: `Good morning! Just a reminder that worship service at ${church} is today at ${serviceTime}. We look forward to seeing you!`,
        },
        {
          title: 'Office Closure Notice — Text',
          tags: ['text', 'general'],
          body: `Please note that ${church} offices will be closed on [DATE] for [REASON]. We will reopen on [DATE]. For urgent matters, call ${phone}. God bless!`,
        },
        {
          title: 'Schedule Change Notice — Email',
          tags: ['email', 'general'],
          body: `Subject: Important schedule update from ${church}\n\nDear [NAME],\n\nWe wanted to let you know about an upcoming change to our schedule.\n\n[DESCRIBE THE CHANGE — e.g., service time, location, cancellation]\n\nThis change is effective [DATE]. We apologize for any inconvenience this may cause and appreciate your understanding.\n\nIf you have any questions, please contact us at ${phone} or ${website}.\n\nThank you,\n${church}`,
        },
        {
          title: 'Community Outreach Invite — Text',
          tags: ['text', 'general'],
          body: `Hi [NAME]! ${church} is hosting [OUTREACH EVENT] on [DATE] and we'd love your help! We'll be serving [WHO WE'RE SERVING] and it's a wonderful chance to make a difference. Interested? Reply or call ${phone}. Thank you!`,
        },
        {
          title: 'Food Pantry Distribution Notice — Text',
          tags: ['text', 'general', 'pantry'],
          body: `${church} Food Pantry distribution is scheduled for [DATE] from [TIME] at [LOCATION]. Open to anyone in need — no appointment required. Bring a photo ID if available. Questions? Call ${phone}. God bless!`,
        },
      ],
    },
  ];

  // ── State ────────────────────────────────────────────────────
  let activeCategory = Storage.get('_templateCategory') || 'visitor';
  let searchQuery    = Storage.get('_templateSearch')   || '';
  let copiedIndex    = null;

  // ── Styles (once) ────────────────────────────────────────────
  if (!document.getElementById('templates-style')) {
    const style = document.createElement('style');
    style.id = 'templates-style';
    style.textContent = `
      .tmpl-cat-btn {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px; border-radius: var(--radius);
        border: 1px solid transparent; background: transparent;
        font-size: .85rem; font-weight: 600; color: var(--text-secondary);
        cursor: pointer; text-align: left; transition: all .15s; width: 100%;
      }
      .tmpl-cat-btn:hover { background: var(--surface-hover); color: var(--text); }
      .tmpl-cat-btn.active { background: var(--accent-subtle); color: var(--accent); border-color: var(--accent); }
      .tmpl-cat-btn .cat-count {
        margin-left: auto; background: var(--surface-2);
        border-radius: 99px; padding: 1px 8px; font-size: .72rem; font-weight: 700; color: var(--text-muted);
      }
      .tmpl-card {
        border: 1px solid var(--border); border-radius: var(--radius-md);
        background: var(--surface); padding: 16px 18px;
        transition: border-color .15s, box-shadow .15s;
      }
      .tmpl-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
      .tmpl-tag {
        display: inline-block; padding: 2px 8px; border-radius: 99px;
        font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
        background: var(--surface-2); color: var(--text-muted); margin-right: 4px;
      }
      .tmpl-body {
        white-space: pre-wrap; font-size: .83rem; line-height: 1.65;
        color: var(--text-secondary); background: var(--surface-2);
        border: 1px solid var(--border); border-radius: var(--radius);
        padding: 12px 14px; margin: 10px 0; max-height: 180px; overflow-y: auto;
        font-family: inherit;
      }
      .tmpl-placeholder { color: var(--accent); font-weight: 600; }
      @media (max-width: 640px) {
        #templates-layout { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Helpers ──────────────────────────────────────────────────
  function highlightPlaceholders(text) {
    return UI.esc(text).replace(/\[([^\]]+)\]/g, '<span class="tmpl-placeholder">[$1]</span>');
  }

  function getFiltered() {
    const cat = categories.find(c => c.id === activeCategory);
    if (!cat) return [];
    if (!searchQuery) return cat.templates;
    const q = searchQuery.toLowerCase();
    return cat.templates.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.body.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    );
  }

  // ── Render ───────────────────────────────────────────────────
  function renderPage() {
    const filtered = getFiltered();

    page.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">
            <i data-lucide="file-text" class="icon-inline" aria-hidden="true"></i>Message Templates
          </h2>
          <div class="section-subtitle">Pre-written messages ready to copy and send — replace <span style="color:var(--accent);font-weight:600;">[bracketed]</span> fields with specifics</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:200px 1fr;gap:20px;align-items:start;" id="templates-layout">

        <!-- Sidebar -->
        <div style="display:flex;flex-direction:column;gap:3px;">
          ${categories.map(c => `
            <button class="tmpl-cat-btn ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}">
              <i data-lucide="${c.icon}" aria-hidden="true" style="width:15px;height:15px;flex-shrink:0;"></i>
              <span style="flex:1">${c.label}</span>
              <span class="cat-count">${c.templates.length}</span>
            </button>
          `).join('')}
        </div>

        <!-- Templates -->
        <div>
          <div style="margin-bottom:16px;">
            <div class="search-input-wrap">
              <i data-lucide="search" class="icon-inline search-icon-lucide" aria-hidden="true"></i>
              <input type="text" class="search-input" id="tmpl-search"
                placeholder="Search templates…" value="${UI.esc(searchQuery)}">
            </div>
          </div>

          ${filtered.length ? `
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${filtered.map((t, i) => `
                <div class="tmpl-card" id="tmpl-${i}">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
                    <div>
                      <div style="font-weight:700;font-size:.92rem;margin-bottom:5px;">${UI.esc(t.title)}</div>
                      <div>${t.tags.map(tag => `<span class="tmpl-tag">${UI.esc(tag)}</span>`).join('')}</div>
                    </div>
                    <button class="btn ${copiedIndex === i ? 'btn-success' : 'btn-outline'} btn-sm" id="copy-btn-${i}" style="flex-shrink:0;min-width:88px;">
                      <i data-lucide="${copiedIndex === i ? 'check' : 'copy'}" aria-hidden="true" style="width:13px;height:13px;margin-right:4px;"></i>
                      ${copiedIndex === i ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div class="tmpl-body">${highlightPlaceholders(t.body)}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state" style="padding:40px 0;">
              <div class="empty-state-icon"><i data-lucide="file-text" aria-hidden="true"></i></div>
              <div class="empty-state-title">No templates found</div>
              <div class="empty-state-body">Try a different search or category.</div>
            </div>
          `}
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Category buttons
    page.querySelectorAll('.tmpl-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        searchQuery = '';
        copiedIndex = null;
        Storage.set('_templateCategory', activeCategory);
        Storage.set('_templateSearch', '');
        renderPage();
      });
    });

    // Search
    const searchEl = document.getElementById('tmpl-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQuery = searchEl.value;
        copiedIndex = null;
        Storage.set('_templateSearch', searchQuery);
        renderPage();
      });
    }

    // Copy buttons
    filtered.forEach((t, i) => {
      const btn = document.getElementById('copy-btn-' + i);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const done = () => {
          copiedIndex = i;
          renderPage();
          setTimeout(() => { copiedIndex = null; renderPage(); }, 2000);
        };
        navigator.clipboard?.writeText(t.body)
          .then(done)
          .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = t.body; ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
            done();
          });
      });
    });
  }

  renderPage();
});

window.Prompts = {};
