/* =============================================================
   prompts.js  —  Message Template Center
   Generates copy-ready prompts to paste into ChatGPT / Claude.
   No direct AI connection — prompts only.
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

  // ── Prompt definitions ───────────────────────────────────────
  const categories = [
    {
      id: 'volunteer',
      label: 'Volunteer Recruitment',
      icon: '<i data-lucide="users" class="icon-inline" aria-hidden="true"></i>',
      color: 'var(--blue)',
      prompts: [
        {
          title: 'General Volunteer Recruitment Email',
          description: 'Warm email to recruit new volunteers for the church',
          generate: () => `Write a warm, inviting email recruiting volunteers for ${churchName}.
The email should:
- Be friendly and non-pressuring
- Emphasize that every role matters, no matter how small
- List these ministry areas needing volunteers: ${[...new Set(volunteers.map(v=>v.team))].join(', ')}
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
      icon: '<i data-lucide="calendar" class="icon-inline" aria-hidden="true"></i>',
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
- Date/Time: ${UI.fmtDate(ev.date)} at ${ev.time}
- Location: ${ev.location}
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
Time: ${ev.time}
Location: ${ev.location}

Please write THREE versions:
1. **Facebook/Instagram post** (80 words max, with 3-5 relevant hashtags)
2. **Church bulletin insert** (100-120 words, formal tone)
3. **Text message blast** (160 characters max)

All versions should emphasize community, fun, and that the event is open to everyone.`;
          },
        },
        {
          title: 'VBS / Youth Event Announcement',
          description: 'Family-focused promotional copy for children/youth events',
          generate: () => `Write exciting promotional copy for Vacation Bible School at ${churchName}.

Include THREE versions:
1. **Parent email** (200 words) — emphasize safety, fun, spiritual growth, and registration info
2. **Social media graphic caption** (60 words + hashtags) — visual, energetic, emoji-friendly
3. **Church bulletin blurb** (75 words) — concise, dates/times, registration link placeholder

Tone: energetic, family-friendly, faith-filled
Target audience: families with children ages 4-12
Include a call-to-action to register or contact the church office`,
        },
      ],
    },
    {
      id: 'visitors',
      label: 'Visitor Follow-Up',
      icon: 'hand',
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
          description: 'Follow-up to a visitor who was "Contacted" but has not returned',
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
          title: 'New Member Connection Letter',
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
      icon: '<i data-lucide="hands" class="icon-inline" aria-hidden="true"></i>',
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
          description: 'Celebratory message sharing answered prayers with the congregation',
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
          title: 'Monthly Newsletter Template',
          description: 'Full monthly newsletter with all sections',
          generate: () => {
            const evList = upcomingEvs.slice(0,4).map(e => `- ${e.name}: ${UI.fmtDate(e.date)} at ${e.time}`).join('\n') || '- Sunday Services: Weekly at 10:00 AM\n- Wednesday Bible Study: Weekly at 7:00 PM';
            return `Create a monthly newsletter for ${churchName}.

Church details:
- Pastor: ${pastorName}
- Active Members: ${members.filter(m=>m.status==='Active').length}
- Upcoming Events:
${evList}

Newsletter sections to include:
1. **Pastor's Note** (150 words) — encouraging monthly message with Scripture
2. **What's Happening** — brief descriptions of 3-4 upcoming events
3. **Ministry Spotlight** — 100-word feature on one ministry area (your choice)
4. **Prayer & Praise** — 3-4 items (mix of needs and answered prayers)
5. **Volunteer Spotlight** — 75-word recognition of a faithful volunteer
6. **Giving Update** — brief thank you for faithful generosity (no specific numbers needed)
7. **Closing Blessing** — short benediction paragraph

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
- Share 3-4 specific ways giving made an impact this year (use placeholder stats: "X families served," "X lives touched," etc.)
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
      icon: '<i data-lucide="smartphone" class="icon-inline" aria-hidden="true"></i>',
      color: 'var(--red)',
      prompts: [
        {
          title: 'Weekly Social Media Pack',
          description: '5 posts for Monday–Friday to keep your feed active',
          generate: () => `Create a 5-post social media content pack for ${churchName} for one week.

Church info: ${churchName} · Pastor: ${pastorName}
${nextEvent ? `Featured event: ${nextEvent.name} on ${UI.fmtDate(nextEvent.date)}` : ''}

Write one post for each day:
- **Monday** — Motivational/inspirational Scripture with a brief reflection (Instagram/Facebook)
- **Tuesday** — Behind-the-scenes or "did you know about our church" post
- **Wednesday** — Mid-week encouragement tied to this week's Bible study theme
- **Thursday** — Upcoming event promotion or volunteer spotlight
- **Friday** — Weekend service preview / invite post

For each post include:
- Caption (max 150 words)
- 5-8 relevant hashtags
- Suggested image description (e.g., "Photo of congregation worshipping")
- Platform note: Facebook, Instagram, or both`,
        },
        {
          title: 'Outreach & Community Impact Post',
          description: 'Posts highlighting food pantry, service projects, and community work',
          generate: () => {
            const pantryTotal = Storage.getAll('foodpantry').reduce((s,r)=>s+r.familiesServed,0);
            return `Write 3 social media posts for ${churchName} highlighting community outreach.

Impact data:
- Food pantry families served: ${pantryTotal || 147}
- Volunteer hours this year: ${Storage.getAll('foodpantry').reduce((s,r)=>s+r.volunteerHours,0) || 312}

Post 1: **Food Pantry impact post** — celebrate families served, invite donations
Post 2: **Volunteer appreciation post** — thank volunteers for their service hours
Post 3: **Community invitation post** — invite the community to receive help OR serve alongside us

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
          title: 'Monthly Ministry Report Summary',
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
- Food pantry families served: ${Storage.getAll('foodpantry').filter(r=>r.date>=Storage.today(-30)).reduce((s,r)=>s+r.familiesServed,0)}

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

  // Active category
  let activeCategory = Storage.get('_promptCategory') || 'volunteer';
  let activePromptIndex = 0;

  function renderPage() {
    const cat = categories.find(c => c.id === activeCategory) || categories[0];

    page.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Message Template Center</h2>
          <div class="section-subtitle">Copy a prompt → paste into ChatGPT or Claude → get polished content instantly</div>
        </div>
      </div>

      <!-- Info Banner -->
      <div style="background:var(--accent-light);border:1px solid var(--accent);border-radius:var(--radius);padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:12px;font-size:.86rem;">
        <i data-lucide="lightbulb" class="icon-inline" aria-hidden="true"></i>
        <div>
          <strong>How it works:</strong> Select a prompt category, choose a template, click <strong>Copy Prompt</strong>, then paste it into
          <a href="https://chat.openai.com" target="_blank" style="color:var(--accent)">ChatGPT</a> or
          <a href="https://claude.ai" target="_blank" style="color:var(--accent)">Claude.ai</a>.
          Prompts are pre-filled with your church's real data from this dashboard.
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start;" id="prompts-layout">

        <!-- Category Sidebar -->
        <div style="display:flex;flex-direction:column;gap:4px;">
          ${categories.map(c => `
            <button class="prompt-cat-btn ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}"
              style="--cat-color:${c.color}">
              <span style="font-size:1.1rem;">${c.icon}</span>
              <span>${c.label}</span>
              <span style="margin-left:auto;background:var(--surface-2);border-radius:99px;padding:1px 7px;font-size:.72rem;">${c.prompts.length}</span>
            </button>
          `).join('')}
        </div>

        <!-- Prompt Content -->
        <div>
          <div style="margin-bottom:16px;">
            <h3 style="font-size:1rem;font-weight:700;">${cat.icon} ${cat.label}</h3>
            <p style="font-size:.84rem;color:var(--text-muted);margin-top:3px;">
              ${cat.prompts.length} ready-to-use prompt${cat.prompts.length!==1?'s':''} · customised with ${UI.esc(churchName)}'s data
            </p>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;" id="prompt-cards-container">
            ${cat.prompts.map((p, i) => `
              <div class="card prompt-card" data-index="${i}" style="cursor:pointer;border:2px solid ${i===activePromptIndex ? 'var(--accent)' : 'var(--border)'};">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                  <div>
                    <div style="font-weight:700;font-size:.92rem;">${UI.esc(p.title)}</div>
                    <div style="font-size:.8rem;color:var(--text-muted);margin-top:3px;">${UI.esc(p.description)}</div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();Prompts.copy('${activeCategory}',${i})" title="Copy prompt to clipboard">
                    <i data-lucide="clipboard-list" class="icon-inline" aria-hidden="true"></i> Copy
                  </button>
                </div>
                ${i === activePromptIndex ? `
                  <div style="margin-top:14px;">
                    <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Generated Prompt Preview</div>
                    <pre id="prompt-preview-${i}" style="white-space:pre-wrap;font-family:inherit;font-size:.82rem;line-height:1.7;background:var(--surface-2);border-radius:var(--radius);padding:14px;border:1px solid var(--border);overflow:auto;max-height:280px;">${UI.esc(p.generate())}</pre>
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                      <button class="btn btn-primary" onclick="Prompts.copy('${activeCategory}',${i})"><i data-lucide="clipboard-list" class="icon-inline" aria-hidden="true"></i> Copy Full Prompt</button>
                      <a href="https://claude.ai" target="_blank" class="btn btn-outline">Open Claude.ai ↗</a>
                      <a href="https://chat.openai.com" target="_blank" class="btn btn-outline">Open ChatGPT ↗</a>
                    </div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Category button styles
    if (!document.getElementById('prompt-cat-style')) {
      const style = document.createElement('style');
      style.id = 'prompt-cat-style';
      style.textContent = `
        .prompt-cat-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: var(--radius);
          border: 1px solid var(--border); background: var(--surface);
          font-size: .84rem; font-weight: 600; color: var(--text-muted);
          cursor: pointer; text-align: left; transition: all .15s;
        }
        .prompt-cat-btn:hover { background: var(--accent-light); color: var(--text); }
        .prompt-cat-btn.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
        @media (max-width: 640px) {
          #prompts-layout { grid-template-columns: 1fr !important; }
          .prompt-cat-btn { font-size: .78rem; padding: 7px 10px; }
        }
      `;
      document.head.appendChild(style);
    }

    // Wire category buttons
    document.querySelectorAll('.prompt-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        activePromptIndex = 0;
        Storage.set('_promptCategory', activeCategory);
        renderPage();
      });
    });

    // Wire prompt card expansion
    document.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', () => {
        const newIndex = parseInt(card.dataset.index);
        if (activePromptIndex === newIndex) return;
        activePromptIndex = newIndex;
        renderPage();
      });
    });
  }

  renderPage();
});

const Prompts = {
  copy(catId, index) {
    const categories_ref = Navigation._modules; // not accessible; rebuild inline
    // Re-generate the prompt text
    const page = document.getElementById('page-prompts');
    const pre = page?.querySelector(`pre[id^="prompt-preview"]`);
    const text = pre?.textContent || document.querySelector('.prompt-card:nth-child(' + (index+1) + ') pre')?.textContent;

    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        Toast.success('Prompt copied to clipboard! Paste it into ChatGPT or Claude.');
      }).catch(() => {
        // Fallback for browsers without clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        Toast.success('Prompt copied!');
      });
    } else {
      Toast.info('Click the prompt card first to expand it, then copy.');
    }
  },
};
window.Prompts = Prompts;
