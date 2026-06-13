/* =============================================================
   prompts.js  —  AI Content Studio
   Generate church communications directly in the dashboard.
   ============================================================= */

Navigation.register('prompts', function render(page) {
  const s = Storage.getSettings();
  const members    = Storage.getAll('members');
  const visitors   = Storage.getAll('visitors');
  const events     = Storage.getAll('events');
  const volunteers = Storage.getAll('volunteers');
  const prayer     = Storage.getAll('prayer');

  const churchName  = s.churchName  || 'Our Church';
  const pastorName  = s.pastorName  || 'our pastor';
  const upcomingEvs = events.filter(e => e.date >= Storage.today()).sort((a,b) => a.date.localeCompare(b.date));
  const nextEvent   = upcomingEvs[0];
  const newVisitors = visitors.filter(v => v.followUpStatus === 'New').slice(0, 3);
  const openPrayer  = prayer.filter(p => p.status !== 'Answered' && !p.private).slice(0, 3);

  // ── Category & prompt definitions ────────────────────────────
  const categories = [
    {
      id: 'volunteer',
      label: 'Volunteer Recruitment',
      icon: 'users',
      color: 'var(--blue)',
      prompts: [
        {
          title: 'General Volunteer Recruitment Email',
          description: 'Warm email to recruit new volunteers for the church',
          generate: () => `Write a warm, inviting email recruiting volunteers for ${churchName}.
The email should:
- Be friendly and non-pressuring
- Emphasize that every role matters, no matter how small
- List these ministry areas needing volunteers: ${[...new Set(volunteers.map(v=>v.team))].filter(Boolean).join(', ') || 'Worship, Children, Hospitality, Outreach'}
- Include a clear call to action to sign up or reach out to ${pastorName}
- Be approximately 200 words
- End with an encouraging Bible verse about serving`,
        },
        {
          title: "Children's Ministry Volunteer Recruitment",
          description: "Targeted recruitment for children's ministry helpers",
          generate: () => `Write a compelling recruitment message for ${churchName}'s Children's Ministry.
Include:
- The joy and impact of serving children
- Specific roles needed: Sunday School teachers, nursery helpers, check-in volunteers
- Background check requirement (frame positively as protecting our children)
- Time commitment: Sunday mornings only, with quarterly training
- A personal appeal from the Children's Ministry director
- Tone: warm, enthusiastic, parent-friendly
- Length: 150-200 words`,
        },
        {
          title: 'Worship Team Recruitment',
          description: 'Invitation to join the worship ministry',
          generate: () => `Create a worship team recruitment post for ${churchName} for use in the church bulletin and social media.
Requirements:
- Instruments/vocals needed: singers, guitar, piano/keys, drums, bass
- Weekly rehearsal on Wednesday evenings + Sunday services
- Emphasize that we welcome all skill levels, not just professionals
- Vision statement: "We lead people into God's presence, not just perform music"
- Include audition/tryout process (casual conversation with worship director)
- Tone: inspiring and accessible
- Keep it under 120 words for bulletin version`,
        },
      ],
    },
    {
      id: 'events',
      label: 'Event Announcements',
      icon: 'calendar',
      color: 'var(--purple)',
      prompts: [
        {
          title: 'Sunday Service Announcement',
          description: 'Weekly bulletin or email announcement for this Sunday',
          generate: () => {
            const ev = nextEvent || { name: 'Sunday Worship Service', date: 'this Sunday', time: '10:00 AM', location: 'Main Sanctuary' };
            return `Write an engaging Sunday service announcement for ${churchName}.
Event details:
- Event: ${ev.name}
- Date/Time: ${UI.fmtDate(ev.date)} at ${ev.time || '10:00 AM'}
- Location: ${ev.location || 'Main Sanctuary'}
- Pastor: ${pastorName}

The announcement should:
- Create excitement and anticipation
- Be welcoming to both regular attendees and potential visitors
- Include a brief "what to expect" section
- Mention childcare/children's programming is available
- Be 100-150 words
- End with welcoming language for first-time visitors`;
          },
        },
        {
          title: 'Special Event Promotion',
          description: 'Social media + bulletin copy for an upcoming event',
          generate: () => {
            const ev = upcomingEvs[1] || nextEvent || { name: 'Community Event', date: 'soon', time: 'TBD', location: 'the church' };
            return `Create promotional copy for an upcoming church event at ${churchName}.

Event: ${ev.name}
Date: ${UI.fmtDate(ev.date)}
Time: ${ev.time || 'TBD'}
Location: ${ev.location || 'the church'}

Please write THREE versions:
1. Facebook/Instagram post (80 words max, with 3-5 relevant hashtags)
2. Church bulletin insert (100-120 words, formal tone)
3. Text message blast (160 characters max)

All versions should emphasize community, fun, and that the event is open to everyone.`;
          },
        },
        {
          title: 'VBS / Youth Event Announcement',
          description: 'Family-focused promotional copy for children/youth events',
          generate: () => `Write exciting promotional copy for Vacation Bible School at ${churchName}.

Include THREE versions:
1. Parent email (200 words) — emphasize safety, fun, spiritual growth, and registration info
2. Social media graphic caption (60 words + hashtags) — visual, energetic, emoji-friendly
3. Church bulletin blurb (75 words) — concise, dates/times, registration link placeholder

Tone: energetic, family-friendly, faith-filled
Target audience: families with children ages 4-12
Include a call-to-action to register or contact the church office`,
        },
      ],
    },
    {
      id: 'visitors',
      label: 'Visitor Follow-Up',
      icon: 'hand-shake',
      color: 'var(--orange)',
      prompts: [
        {
          title: 'First-Time Visitor Welcome Email',
          description: 'Warm follow-up email for first-time visitors',
          generate: () => {
            const v = newVisitors[0];
            return `Write a warm, personal first-time visitor follow-up email for ${churchName}.

${v ? `This email is for: ${v.name} who visited on ${UI.fmtDate(v.visitDate)}` : 'Write as a template with [VISITOR NAME] and [VISIT DATE] placeholders'}

The email should:
- Come from ${pastorName} personally
- Express genuine gratitude for their visit
- Share 2-3 sentences about the church's heart and mission
- Mention 1-2 upcoming events they might enjoy
- Invite them back without pressure
- Offer to answer any questions
- Include contact information
- Tone: warm, genuine, non-salesy
- Length: 200-250 words`;
          },
        },
        {
          title: 'Second Visit Invitation',
          description: 'Follow-up to a visitor who was contacted but has not returned',
          generate: () => `Write a gentle second-follow-up message to a visitor at ${churchName} who was contacted once but hasn't returned.

Scenario: They visited about 3-4 weeks ago. We reached out once and they were friendly but haven't come back.

The message should:
- Be available in two formats: email (150 words) and text message (120 characters)
- Feel personal, not like a form letter
- Mention a specific upcoming event as a low-pressure re-invitation
- Affirm that the door is always open, no pressure
- Be warm but respect their space
- Offer to connect them with a specific small group or ministry based on their interests`,
        },
        {
          title: 'New Member Welcome Letter',
          description: 'Official welcome when a visitor decides to join',
          generate: () => `Write a formal yet warm welcome letter for a new member joining ${churchName}.

The letter should:
- Be signed by ${pastorName}
- Celebrate their decision to join the church family
- Outline next steps: membership class, small group connection, ministry involvement
- Include key info about the church: service times, address, website
- Reference the church's mission and vision
- Invite them to a new members lunch/gathering
- Close with a blessing/prayer
- Tone: official but heartfelt
- Length: 300-350 words
- Format: letter format with date and signature block`,
        },
      ],
    },
    {
      id: 'prayer',
      label: 'Prayer Team Messages',
      icon: 'heart-handshake',
      color: 'var(--green)',
      prompts: [
        {
          title: 'Weekly Prayer Focus Email',
          description: 'Email to the congregation with prayer points for the week',
          generate: () => {
            const points = openPrayer.map((p,i) => `${i+1}. ${p.category}: ${p.private ? '[Private request — pray for this family]' : p.request.slice(0,80)}`).join('\n');
            return `Write a weekly prayer focus email for ${churchName} congregation.

Current prayer requests to include:
${points || '1. Church growth and new visitors\n2. Health needs in our congregation\n3. Our community outreach efforts'}

The email should:
- Open with a brief devotional thought on prayer (2-3 sentences, include a Scripture)
- Present each request with compassion and privacy respected
- Close with a short written prayer that members can pray along with
- Encourage members to submit their own requests
- Tone: reverent, compassionate, faith-filled
- Length: 300-400 words
- Sign off from the Prayer Team at ${churchName}`;
          },
        },
        {
          title: 'Answered Prayer Praise Report',
          description: 'Celebratory message sharing answered prayers',
          generate: () => `Write a praise report email for ${churchName} sharing answered prayer.

Format:
- Open with excitement about seeing God at work
- Include a "testimony spotlight" section with placeholder for a specific answered prayer story
- Include a Scripture about thanksgiving and praise
- Celebrate specific prayer milestones (e.g., "X prayers submitted this year, X answered!")
- Encourage members to share their own praise reports
- Include a brief prayer of thanksgiving
- Tone: joyful, celebratory, worshipful
- Length: 200-250 words`,
        },
        {
          title: 'Prayer Team Recruitment',
          description: 'Invitation to join the church prayer ministry',
          generate: () => `Write a recruitment message for ${churchName}'s prayer team.

The message should:
- Cast a vision for the power and importance of intercessory prayer
- Describe what the prayer team does: weekly email updates, prayer wall, prayer chain
- Commitment level: 30 minutes per week minimum
- No formal training required — just a heart to pray
- Mention prayer team meetings (e.g., Sunday mornings 30 minutes before service)
- Include a compelling Scripture about prayer
- Tone: passionate, accessible, spiritually motivating
- Length: 150-200 words`,
        },
      ],
    },
    {
      id: 'newsletter',
      label: 'Newsletter Content',
      icon: 'newspaper',
      color: 'var(--yellow)',
      prompts: [
        {
          title: 'Monthly Newsletter',
          description: 'Full monthly newsletter with all sections',
          generate: () => {
            const evList = upcomingEvs.slice(0,4).map(e => `- ${e.name}: ${UI.fmtDate(e.date)} at ${e.time||'TBD'}`).join('\n') || '- Sunday Services: Weekly at 10:00 AM\n- Wednesday Bible Study: Weekly at 7:00 PM';
            return `Create a monthly newsletter for ${churchName}.

Church details:
- Pastor: ${pastorName}
- Active Members: ${members.filter(m=>m.status==='Active').length}
- Upcoming Events:\n${evList}

Newsletter sections to include:
1. Pastor's Note (150 words) — encouraging monthly message with Scripture
2. What's Happening — brief descriptions of 3-4 upcoming events
3. Ministry Spotlight — 100-word feature on one ministry area
4. Prayer & Praise — 3-4 items (mix of needs and answered prayers)
5. Volunteer Spotlight — 75-word recognition of a faithful volunteer
6. Giving Update — brief thank you for faithful generosity
7. Closing Blessing — short benediction paragraph

Tone: warm, community-focused, inspiring
Total length: 700-900 words`;
          },
        },
        {
          title: 'Giving Campaign Letter',
          description: 'Year-end or stewardship campaign letter',
          generate: () => `Write a year-end giving campaign letter for ${churchName}.

The letter should:
- Come from ${pastorName}
- Open with gratitude for the congregation's faithfulness
- Share 3-4 specific ways giving made an impact this year (use placeholder stats)
- Cast vision for what giving will accomplish next year
- Present the ask as an opportunity to partner in God's work, not an obligation
- Include a Scripture on stewardship and generosity
- Offer 3 giving options: online, mail, in-person
- Close with a prayer of blessing over givers
- Tone: grateful, visionary, faith-filled — never guilt-based
- Length: 400-450 words`,
        },
      ],
    },
    {
      id: 'social',
      label: 'Social Media Posts',
      icon: 'smartphone',
      color: 'var(--red)',
      prompts: [
        {
          title: 'Weekly Social Media Pack',
          description: '5 posts for Monday–Friday to keep your feed active',
          generate: () => `Create a 5-post social media content pack for ${churchName} for one week.

Church info: ${churchName} · Pastor: ${pastorName}
${nextEvent ? `Featured event: ${nextEvent.name} on ${UI.fmtDate(nextEvent.date)}` : ''}

Write one post for each day:
- Monday — Motivational/inspirational Scripture with a brief reflection (Instagram/Facebook)
- Tuesday — Behind-the-scenes or "did you know about our church" post
- Wednesday — Mid-week encouragement tied to this week's Bible study theme
- Thursday — Upcoming event promotion or volunteer spotlight
- Friday — Weekend service preview / invite post

For each post include:
- Caption (max 150 words)
- 5-8 relevant hashtags
- Suggested image description
- Platform note: Facebook, Instagram, or both`,
        },
        {
          title: 'Outreach & Community Impact Posts',
          description: 'Posts highlighting food pantry, service projects, and community work',
          generate: () => {
            const pantryTotal = Storage.getAll('foodpantry').reduce((s,r)=>s+(r.familiesServed||0),0);
            return `Write 3 social media posts for ${churchName} highlighting community outreach.

Impact data:
- Food pantry families served: ${pantryTotal || 147}
- Volunteer hours this year: ${Storage.getAll('foodpantry').reduce((s,r)=>s+(r.volunteerHours||0),0) || 312}

Post 1: Food Pantry impact post — celebrate families served, invite donations
Post 2: Volunteer appreciation post — thank volunteers for their service hours
Post 3: Community invitation post — invite the community to receive help OR serve alongside us

For each post:
- Caption (100 words max)
- Tone: humble, grateful, community-focused (not self-congratulatory)
- 4-6 hashtags
- Suggested image description`;
          },
        },
      ],
    },
    {
      id: 'reports',
      label: 'Ministry Reports',
      icon: 'bar-chart-2',
      color: 'var(--text-muted)',
      prompts: [
        {
          title: 'Monthly Ministry Report',
          description: 'Summary report for leadership / board meetings',
          generate: () => {
            const activeVols = volunteers.filter(v=>v.bgCheck==='Approved').length;
            const eventsThisMonth = events.filter(e => e.date >= Storage.today(-30) && e.date <= Storage.today()).length;
            return `Write a monthly ministry report for ${churchName} leadership board.

Data to include:
- Total active members: ${members.filter(m=>m.status==='Active').length}
- New visitors this month: ${visitors.filter(v => v.visitDate >= Storage.today(-30)).length}
- Volunteers serving: ${activeVols} (${volunteers.filter(v=>v.bgCheck==='Pending').length} background checks pending)
- Events held: ${eventsThisMonth}
- Prayer requests received: ${prayer.filter(p=>p.date>=Storage.today(-30)).length}
- Food pantry families served: ${Storage.getAll('foodpantry').filter(r=>r.date>=Storage.today(-30)).reduce((s,r)=>s+(r.familiesServed||0),0)}

Format the report with these sections:
1. Executive Summary (3-4 sentences)
2. Attendance & Growth (with brief analysis)
3. Ministry Highlights (3 bullet points)
4. Volunteer & Staffing Update
5. Outreach & Community Impact
6. Prayer & Pastoral Care
7. Upcoming Focus Areas (next 30 days)
8. Items for Board Discussion

Tone: professional, data-informed, ministry-focused
Total length: 500-600 words`;
          },
        },
        {
          title: 'Annual Report Narrative',
          description: 'Year-in-review narrative for the annual church report',
          generate: () => `Write the narrative section of ${churchName}'s annual report.

The narrative should:
- Open with a vision statement from ${pastorName}
- Celebrate 5-6 major milestones and wins from the year (use placeholders like "[MILESTONE]")
- Highlight growth in key areas: attendance, giving, volunteers, outreach
- Tell 1-2 "story moments" that capture the church's heart (use placeholders)
- Cast vision for the coming year with 3 specific goals
- Close with gratitude to God and the congregation
- Include section headers for easy reading
- Tone: celebratory, visionary, grateful
- Length: 600-700 words
- Format: ready for print in an annual report booklet`,
        },
      ],
    },
  ];

  // ── State ──────────────────────────────────────────────────────
  let activeCategory = Storage.get('_promptCategory') || 'volunteer';

  // Per-prompt output state: { [catId_index]: { loading, output, error } }
  const _state = {};
  function stateKey(catId, i) { return catId + '_' + i; }
  function getState(catId, i) { return _state[stateKey(catId, i)] || {}; }
  function setState(catId, i, patch) {
    const k = stateKey(catId, i);
    _state[k] = Object.assign({}, _state[k], patch);
  }

  // ── Inject styles once ─────────────────────────────────────────
  if (!document.getElementById('prompts-style')) {
    const style = document.createElement('style');
    style.id = 'prompts-style';
    style.textContent = `
      .prompt-cat-btn {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 12px; border-radius: var(--radius);
        border: 1px solid var(--border); background: var(--surface);
        font-size: .84rem; font-weight: 600; color: var(--text-muted);
        cursor: pointer; text-align: left; transition: all .15s; width: 100%;
      }
      .prompt-cat-btn:hover { background: var(--surface-hover); color: var(--text); }
      .prompt-cat-btn.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
      .prompt-cat-btn .cat-count {
        margin-left: auto; background: var(--surface-2);
        border-radius: 99px; padding: 1px 8px; font-size: .72rem; font-weight: 700;
      }
      .prompt-card {
        border: 1px solid var(--border); border-radius: var(--radius-md);
        background: var(--surface); transition: border-color .15s;
      }
      .prompt-card-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 12px; padding: 16px 18px;
        cursor: pointer;
      }
      .prompt-card-body { padding: 0 18px 16px; border-top: 1px solid var(--border); padding-top: 16px; }
      .prompt-output {
        width: 100%; box-sizing: border-box;
        font-family: inherit; font-size: .85rem; line-height: 1.7;
        background: var(--surface-2); border: 1px solid var(--border);
        border-radius: var(--radius); padding: 14px; color: var(--text);
        resize: vertical; min-height: 180px;
      }
      .prompt-generate-btn { min-width: 140px; }
      @media (max-width: 640px) {
        #prompts-layout { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Render ────────────────────────────────────────────────────
  function renderPage() {
    const _cat = categories.find(c => c.id === activeCategory) || categories[0];

    page.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title"><i data-lucide="sparkles" class="icon-inline" aria-hidden="true"></i>AI Content Studio</h2>
          <div class="section-subtitle">Generate church communications directly — pre-filled with your real data</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:210px 1fr;gap:20px;align-items:start;" id="prompts-layout">

        <!-- Category sidebar -->
        <div style="display:flex;flex-direction:column;gap:3px;">
          ${categories.map(c => `
            <button class="prompt-cat-btn ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}">
              <i data-lucide="${c.icon}" aria-hidden="true" style="width:16px;height:16px;flex-shrink:0;"></i>
              <span style="flex:1">${c.label}</span>
              <span class="cat-count">${c.prompts.length}</span>
            </button>
          `).join('')}
        </div>

        <!-- Prompt cards -->
        <div>
          <div style="margin-bottom:14px;">
            <h3 style="font-size:1rem;font-weight:700;display:flex;align-items:center;gap:6px;">
              <i data-lucide="${cat.icon}" aria-hidden="true" style="width:16px;height:16px;color:${cat.color}"></i>
              ${cat.label}
            </h3>
            <p style="font-size:.82rem;color:var(--text-muted);margin-top:3px;">
              ${cat.prompts.length} template${cat.prompts.length!==1?'s':''} · pre-filled with ${UI.esc(churchName)}'s data
            </p>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;" id="prompt-cards-container">
            ${cat.prompts.map((p, i) => {
              const st = getState(cat.id, i);
              return `
              <div class="prompt-card" id="pcard-${i}">
                <div class="prompt-card-header" data-expand="${i}">
                  <div>
                    <div style="font-weight:700;font-size:.92rem;">${UI.esc(p.title)}</div>
                    <div style="font-size:.8rem;color:var(--text-muted);margin-top:3px;">${UI.esc(p.description)}</div>
                  </div>
                  <i data-lucide="chevron-down" aria-hidden="true" style="width:16px;height:16px;flex-shrink:0;margin-top:2px;color:var(--text-muted);transition:transform .2s;${st.expanded?'transform:rotate(180deg)':''}"></i>
                </div>
                ${st.expanded ? `
                <div class="prompt-card-body">
                  <div style="margin-bottom:12px;">
                    <button class="btn btn-primary prompt-generate-btn" id="gen-btn-${i}" ${st.loading?'disabled':''}>
                      ${st.loading
                        ? `<i data-lucide="loader-2" aria-hidden="true" style="width:14px;height:14px;animation:spin 1s linear infinite;margin-right:6px;"></i>Generating…`
                        : `<i data-lucide="sparkles" aria-hidden="true" style="width:14px;height:14px;margin-right:6px;"></i>Generate`}
                    </button>
                    <button class="btn btn-ghost btn-sm" id="copy-prompt-btn-${i}" style="margin-left:6px;" title="Copy the raw prompt to clipboard instead">
                      <i data-lucide="clipboard" aria-hidden="true" style="width:13px;height:13px;margin-right:4px;"></i>Copy Prompt
                    </button>
                  </div>
                  ${st.error ? `<div style="color:var(--red);font-size:.82rem;margin-bottom:10px;">${UI.esc(st.error)}</div>` : ''}
                  ${st.output ? `
                    <textarea class="prompt-output" id="output-${i}">${UI.esc(st.output)}</textarea>
                    <div style="display:flex;gap:8px;margin-top:10px;">
                      <button class="btn btn-outline btn-sm" id="copy-output-btn-${i}">
                        <i data-lucide="copy" aria-hidden="true" style="width:13px;height:13px;margin-right:4px;"></i>Copy Output
                      </button>
                      <button class="btn btn-ghost btn-sm" id="regen-btn-${i}">
                        <i data-lucide="refresh-cw" aria-hidden="true" style="width:13px;height:13px;margin-right:4px;"></i>Regenerate
                      </button>
                    </div>
                  ` : (!st.loading && !st.error ? `
                    <div style="font-size:.8rem;color:var(--text-muted);padding:10px 0;">
                      Click <strong>Generate</strong> to create this content using your church's data.
                      ${!SupabaseDB.isAuthenticated() ? '<br><span style="color:var(--orange);">Sign in to Supabase to enable AI generation.</span>' : ''}
                    </div>
                  ` : '')}
                </div>
                ` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Category buttons
    document.querySelectorAll('.prompt-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        Storage.set('_promptCategory', activeCategory);
        renderPage();
      });
    });

    // Expand/collapse
    document.querySelectorAll('[data-expand]').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.expand);
        const cat = categories.find(c => c.id === activeCategory);
        const was = getState(activeCategory, i).expanded;
        cat.prompts.forEach((_, j) => setState(activeCategory, j, { expanded: false }));
        setState(activeCategory, i, { expanded: !was });
        renderPage();
      });
    });

    // Wire generate buttons
    _cat.prompts.forEach((p, i) => {
      const genBtn       = document.getElementById('gen-btn-' + i);
      const regenBtn     = document.getElementById('regen-btn-' + i);
      const copyPromptBtn = document.getElementById('copy-prompt-btn-' + i);
      const copyOutputBtn = document.getElementById('copy-output-btn-' + i);

      async function doGenerate() {
        setState(activeCategory, i, { loading: true, error: null, output: null });
        renderPage();
        const promptText = p.generate();
        const res = await SupabaseDB.generateContent(promptText);
        if (res.ok) {
          setState(activeCategory, i, { loading: false, output: res.draft });
        } else {
          setState(activeCategory, i, { loading: false, error: 'Generation failed: ' + res.error });
        }
        renderPage();
      }

      if (genBtn)   genBtn.addEventListener('click', doGenerate);
      if (regenBtn) regenBtn.addEventListener('click', doGenerate);

      if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', e => {
          e.stopPropagation();
          const text = p.generate();
          navigator.clipboard?.writeText(text)
            .then(() => Toast.success('Prompt copied — paste into Claude.ai or ChatGPT.'))
            .catch(() => {
              const ta = document.createElement('textarea');
              ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
              document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
              Toast.success('Prompt copied!');
            });
        });
      }

      if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', () => {
          const ta   = document.getElementById('output-' + i);
          const text = ta ? ta.value : (getState(activeCategory, i).output || '');
          navigator.clipboard?.writeText(text)
            .then(() => Toast.success('Copied!'))
            .catch(() => { if (ta) { ta.select(); document.execCommand('copy'); Toast.success('Copied!'); } });
        });
      }
    });
  }

  renderPage();
  // Auto-expand first card
  if (!categories.find(c=>c.id===activeCategory)?.prompts.some((_, i) => getState(activeCategory, i).expanded)) {
    setState(activeCategory, 0, { expanded: true });
    renderPage();
  }
});

window.Prompts = {};
