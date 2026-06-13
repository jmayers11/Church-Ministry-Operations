/* =============================================================
   storage.js  —  Centralised localStorage data layer
   All modules read/write through this API — never directly.
   ============================================================= */

const Storage = (() => {

  const PREFIX = 'church_';

  // ── Primitives ──────────────────────────────────────────────
  function _key(name) { return PREFIX + name; }

  function get(name) {
    try {
      const raw = localStorage.getItem(_key(name));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(name, value) {
    try {
      localStorage.setItem(_key(name), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage.set failed:', e);
      return false;
    }
  }

  function remove(name) {
    localStorage.removeItem(_key(name));
  }

  // ── Collection helpers ──────────────────────────────────────
  // Collections are plain arrays stored under a named key.
  // Each item must have a unique `id` field.

  function getAll(collection) {
    return get(collection) || [];
  }

  function saveAll(collection, items) {
    return set(collection, items);
  }

  function findById(collection, id) {
    return getAll(collection).find(item => item.id === id) || null;
  }

  function insert(collection, item) {
    if (!item.id) item.id = uid();
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    const items = getAll(collection);
    items.push(item);
    saveAll(collection, items);
    return item;
  }

  function update(collection, id, changes) {
    const items = getAll(collection);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() };
    saveAll(collection, items);
    return items[idx];
  }

  function remove_item(collection, id) {
    const items = getAll(collection).filter(i => i.id !== id);
    saveAll(collection, items);
  }

  // ── Settings ────────────────────────────────────────────────
  const SETTINGS_KEY = 'settings';

  const DEFAULT_SETTINGS = {
    churchName:   'Grace Community Church',
    pastorName:   'Pastor James Wilson',
    address:      '123 Faith Avenue, Springfield, IL 62701',
    phone:        '(217) 555-0100',
    email:        'office@gracecommunity.org',
    website:      'www.gracecommunity.org',
    accentColor:  '#4f6ef7',
    theme:        'light',
    fontFamily:   'Inter',
    logoDataUrl:  '',
  };

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...(get(SETTINGS_KEY) || {}) };
  }

  function saveSettings(partial) {
    const current = getSettings();
    set(SETTINGS_KEY, { ...current, ...partial });
  }

  // ── Export / Import ─────────────────────────────────────────
  function exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) {
        try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k.slice(PREFIX.length)] = localStorage.getItem(k); }
      }
    }
    return data;
  }

  function importAll(data) {
    Object.entries(data).forEach(([k, v]) => {
      set(k, v);
    });
  }

  // ── Seed Demo Data ──────────────────────────────────────────
  // Called once on first load; skipped if data already exists.
  function seedIfEmpty() {
    if (!window.DEMO_MODE) return;   // no demo data in production
    if (get('_seeded')) return;
    _seedMembers();
    _seedVisitors();
    _seedVolunteers();
    _seedPrayer();
    _seedEvents();
    _seedFoodPantry();
    _seedCare();
    _seedTasks();
    set('_seeded', true);
  }

  // ── Utility ─────────────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function today(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  }

  // ══════════════════════════════════════════════════════════════
  //  DEMO DATA SEEDERS
  // ══════════════════════════════════════════════════════════════

  function _seedMembers() {
    const members = [
      { id: uid(), firstName: 'James',   lastName: 'Wilson',    family: 'Wilson',    phone: '(217) 555-0101', email: 'james.wilson@email.com',   birthday: '1970-03-15', anniversary: '1995-06-10', address: '412 Maple St, Springfield, IL', ministries: ['Worship', 'Leadership'], status: 'Active',   notes: 'Lead Pastor', createdAt: today(-400) },
      { id: uid(), firstName: 'Sarah',   lastName: 'Wilson',    family: 'Wilson',    phone: '(217) 555-0102', email: 'sarah.wilson@email.com',    birthday: '1973-07-22', anniversary: '1995-06-10', address: '412 Maple St, Springfield, IL', ministries: ['Children'], status: 'Active',   notes: "Pastor's wife", createdAt: today(-400) },
      { id: uid(), firstName: 'Michael', lastName: 'Thompson',  family: 'Thompson',  phone: '(217) 555-0103', email: 'mthompson@email.com',       birthday: '1965-11-04', anniversary: '1990-08-20', address: '88 Oak Ave, Springfield, IL',   ministries: ['Deacon', 'Hospitality'], status: 'Active',   notes: '', createdAt: today(-380) },
      { id: uid(), firstName: 'Linda',   lastName: 'Thompson',  family: 'Thompson',  phone: '(217) 555-0104', email: 'linda.t@email.com',         birthday: '1968-02-14', anniversary: '1990-08-20', address: '88 Oak Ave, Springfield, IL',   ministries: ['Women\'s Ministry'], status: 'Active',   notes: '', createdAt: today(-380) },
      { id: uid(), firstName: 'David',   lastName: 'Martinez',  family: 'Martinez',  phone: '(217) 555-0105', email: 'dmartinez@email.com',       birthday: '1982-09-30', anniversary: '2008-05-12', address: '220 Elm Blvd, Springfield, IL', ministries: ['Youth', 'Outreach'], status: 'Active',   notes: 'Youth leader', createdAt: today(-350) },
      { id: uid(), firstName: 'Maria',   lastName: 'Martinez',  family: 'Martinez',  phone: '(217) 555-0106', email: 'mmartinez@email.com',       birthday: '1985-01-18', anniversary: '2008-05-12', address: '220 Elm Blvd, Springfield, IL', ministries: ['Worship'], status: 'Active',   notes: '', createdAt: today(-350) },
      { id: uid(), firstName: 'Robert',  lastName: 'Jackson',   family: 'Jackson',   phone: '(217) 555-0107', email: 'rjackson@email.com',        birthday: '1958-06-09', anniversary: '',           address: '55 Pine Rd, Springfield, IL',   ministries: ['Deacon', 'Security'], status: 'Active',   notes: 'Head deacon', createdAt: today(-320) },
      { id: uid(), firstName: 'Patricia',lastName: 'Davis',     family: 'Davis',     phone: '(217) 555-0108', email: 'pdavis@email.com',          birthday: '1950-12-25', anniversary: '',           address: '19 Cherry Ln, Springfield, IL', ministries: ['Prayer Team'], status: 'Active',   notes: 'Prayer team leader', createdAt: today(-300) },
      { id: uid(), firstName: 'Kevin',   lastName: 'Brown',     family: 'Brown',     phone: '(217) 555-0109', email: 'kbrown@email.com',          birthday: '1992-04-07', anniversary: '',           address: '310 Cedar St, Springfield, IL', ministries: ['Worship', 'Audio/Visual'], status: 'Active',   notes: '', createdAt: today(-280) },
      { id: uid(), firstName: 'Angela',  lastName: 'Lee',       family: 'Lee',       phone: '(217) 555-0110', email: 'alee@email.com',            birthday: '1988-08-15', anniversary: '2015-09-03', address: '47 Birch Way, Springfield, IL', ministries: ['Children', 'Hospitality'], status: 'Active',   notes: 'Nursery coordinator', createdAt: today(-260) },
      { id: uid(), firstName: 'Thomas',  lastName: 'Lee',       family: 'Lee',       phone: '(217) 555-0111', email: 'tlee@email.com',            birthday: '1986-05-21', anniversary: '2015-09-03', address: '47 Birch Way, Springfield, IL', ministries: ['Small Groups'], status: 'Active',   notes: '', createdAt: today(-260) },
      { id: uid(), firstName: 'Nancy',   lastName: 'Garcia',    family: 'Garcia',    phone: '(217) 555-0112', email: 'ngarcia@email.com',         birthday: '1975-10-11', anniversary: '2001-07-08', address: '602 Walnut Dr, Springfield, IL',ministries: ['Food Pantry', 'Outreach'], status: 'Active',   notes: 'Food pantry director', createdAt: today(-240) },
      { id: uid(), firstName: 'Carlos',  lastName: 'Garcia',    family: 'Garcia',    phone: '(217) 555-0113', email: 'cgarcia@email.com',         birthday: '1972-03-27', anniversary: '2001-07-08', address: '602 Walnut Dr, Springfield, IL',ministries: ['Outreach'], status: 'Active',   notes: '', createdAt: today(-240) },
      { id: uid(), firstName: 'Susan',   lastName: 'Anderson',  family: 'Anderson',  phone: '(217) 555-0114', email: 'sanderson@email.com',       birthday: '1963-09-19', anniversary: '',           address: '11 Aspen Ct, Springfield, IL',  ministries: ['Worship'], status: 'Active',   notes: 'Choir director', createdAt: today(-220) },
      { id: uid(), firstName: 'Brian',   lastName: 'Taylor',    family: 'Taylor',    phone: '(217) 555-0115', email: 'btaylor@email.com',         birthday: '1990-07-03', anniversary: '',           address: '78 Spruce Ave, Springfield, IL',ministries: ['Youth', 'Small Groups'], status: 'Active',   notes: '', createdAt: today(-200) },
      { id: uid(), firstName: 'Dorothy', lastName: 'White',     family: 'White',     phone: '(217) 555-0116', email: 'dwhite@email.com',          birthday: '1945-02-28', anniversary: '1967-04-14', address: '93 Hickory Rd, Springfield, IL',ministries: ['Prayer Team', 'Hospitality'], status: 'Active',   notes: '', createdAt: today(-190) },
      { id: uid(), firstName: 'Eric',    lastName: 'Harris',    family: 'Harris',    phone: '(217) 555-0117', email: 'eharris@email.com',         birthday: '1995-11-30', anniversary: '',           address: '204 Poplar St, Springfield, IL',ministries: ['Audio/Visual', 'Youth'], status: 'Active',   notes: '', createdAt: today(-170) },
      { id: uid(), firstName: 'Carol',   lastName: 'Clark',     family: 'Clark',     phone: '(217) 555-0118', email: 'cclark@email.com',          birthday: '1978-06-16', anniversary: '2005-10-01', address: '39 Magnolia Blvd, Springfield, IL', ministries: ['Children', 'Women\'s Ministry'], status: 'Active', notes: '', createdAt: today(-150) },
      { id: uid(), firstName: 'Paul',    lastName: 'Robinson',  family: 'Robinson',  phone: '(217) 555-0119', email: 'probinson@email.com',       birthday: '1969-08-22', anniversary: '1994-03-18', address: '151 Willow Way, Springfield, IL', ministries: ['Deacon', 'Small Groups'], status: 'Active',  notes: '', createdAt: today(-140) },
      { id: uid(), firstName: 'Helen',   lastName: 'Robinson',  family: 'Robinson',  phone: '(217) 555-0120', email: 'hrobinson@email.com',       birthday: '1971-12-05', anniversary: '1994-03-18', address: '151 Willow Way, Springfield, IL', ministries: ['Hospitality'], status: 'Active',    notes: '', createdAt: today(-140) },
      { id: uid(), firstName: 'Greg',    lastName: 'Foster',    family: 'Foster',    phone: '(217) 555-0121', email: 'gfoster@email.com',         birthday: '2001-05-14', anniversary: '',           address: '26 Sycamore Dr, Springfield, IL', ministries: ['Youth'],   status: 'Active',    notes: 'College student', createdAt: today(-120) },
      { id: uid(), firstName: 'Megan',   lastName: 'Murphy',    family: 'Murphy',    phone: '(217) 555-0122', email: 'mmurphy@email.com',         birthday: '1999-09-08', anniversary: '',           address: '57 Chestnut Pl, Springfield, IL', ministries: ['Worship', 'Youth'], status: 'Active',  notes: '', createdAt: today(-110) },
      { id: uid(), firstName: 'Frank',   lastName: 'Rivera',    family: 'Rivera',    phone: '(217) 555-0123', email: 'frivera@email.com',         birthday: '1955-04-20', anniversary: '1978-11-25', address: '388 Redwood Ct, Springfield, IL', ministries: ['Security', 'Deacon'], status: 'Active', notes: '', createdAt: today(-100) },
      { id: uid(), firstName: 'Gloria',  lastName: 'Cooper',    family: 'Cooper',    phone: '(217) 555-0124', email: 'gcooper@email.com',         birthday: '1980-07-12', anniversary: '2006-02-14', address: '14 Dogwood Ln, Springfield, IL',  ministries: ['Food Pantry', 'Care'], status: 'Active', notes: '', createdAt: today(-90) },
      { id: uid(), firstName: 'Mark',    lastName: 'Hughes',    family: 'Hughes',    phone: '(217) 555-0125', email: 'mhughes@email.com',         birthday: '1987-03-03', anniversary: '',           address: '72 Cottonwood St, Springfield, IL', ministries: ['Small Groups'], status: 'Inactive', notes: 'Moved away temporarily', createdAt: today(-80) },
    ];
    saveAll('members', members);
  }

  function _seedVisitors() {
    const visitors = [
      { id: uid(), name: 'Jason & Emily Reed',  visitDate: today(-5),  phone: '(217) 555-0201', email: 'jreed@email.com',    followUpStatus: 'New',          assignedTo: 'Angela Lee',     notes: 'Young couple, two small kids. Seemed interested in children\'s ministry.', createdAt: today(-5) },
      { id: uid(), name: 'Marcus Johnson',       visitDate: today(-12), phone: '(217) 555-0202', email: 'marcusj@email.com',  followUpStatus: 'Contacted',    assignedTo: 'David Martinez', notes: 'College student. Connected with youth group. Follow-up call made.', createdAt: today(-12) },
      { id: uid(), name: 'Sophia Nguyen',        visitDate: today(-19), phone: '(217) 555-0203', email: 'snguyen@email.com',  followUpStatus: 'Invited Back', assignedTo: 'Linda Thompson', notes: 'Visiting from out of town, may relocate to area.', createdAt: today(-19) },
      { id: uid(), name: 'The Patel Family',     visitDate: today(-26), phone: '(217) 555-0204', email: 'patel.fam@email.com',followUpStatus: 'Connected',    assignedTo: 'Carol Clark',    notes: 'Joined small group. Kids enrolled in Sunday school. Great fit!', createdAt: today(-26) },
      { id: uid(), name: 'Robert & June Hall',   visitDate: today(-33), phone: '(217) 555-0205', email: 'rhall@email.com',    followUpStatus: 'Contacted',    assignedTo: 'Patricia Davis', notes: 'Retired couple new to the area. Very engaged during service.', createdAt: today(-33) },
      { id: uid(), name: 'Tina Brooks',          visitDate: today(-3),  phone: '(217) 555-0206', email: 'tbrooks@email.com',  followUpStatus: 'New',          assignedTo: '',               notes: 'Single mom. Needs to be contacted this week.', createdAt: today(-3) },
    ];
    saveAll('visitors', visitors);
  }

  function _seedVolunteers() {
    const volunteers = [
      { id: uid(), memberId: '', name: 'Kevin Brown',    role: 'Audio/Visual Lead', team: 'Worship Team',      availability: 'Sundays + Wed', bgCheck: 'Approved', schedulingNotes: 'Primary sound tech', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Angela Lee',     role: 'Nursery Lead',      team: "Children's Ministry", availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: 'Leads 0-2 year room', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Maria Martinez', role: 'Worship Singer',    team: 'Worship Team',      availability: 'Sundays + rehearsals', bgCheck: 'Approved', schedulingNotes: 'Alto', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Susan Anderson', role: 'Choir Director',    team: 'Worship Team',      availability: 'Sundays + Wed', bgCheck: 'Approved', schedulingNotes: '', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Megan Murphy',   role: 'Worship Singer',    team: 'Worship Team',      availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: 'Soprano', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Carol Clark',    role: 'Sunday School Teacher', team: "Children's Ministry", availability: 'Sundays', bgCheck: 'Approved', schedulingNotes: 'Ages 5-8', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Linda Thompson', role: 'Children\'s Check-In', team: "Children's Ministry", availability: 'Sundays', bgCheck: 'Approved', schedulingNotes: '', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Helen Robinson', role: 'Greeter',           team: 'Hospitality',       availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: 'Rotates with Dorothy', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Dorothy White',  role: 'Hospitality Lead',  team: 'Hospitality',       availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: 'Organises post-service coffee', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Nancy Garcia',   role: 'Food Pantry Director', team: 'Outreach',       availability: 'Tues + Thurs',  bgCheck: 'Approved', schedulingNotes: 'Coordinates all food pantry ops', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Carlos Garcia',  role: 'Outreach Worker',   team: 'Outreach',          availability: 'Saturdays',     bgCheck: 'Pending',  schedulingNotes: '', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Frank Rivera',   role: 'Safety Team Lead',  team: 'Security',          availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: 'Carries radio', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Robert Jackson', role: 'Safety Team',       team: 'Security',          availability: 'Sundays',       bgCheck: 'Approved', schedulingNotes: '', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'Brian Taylor',   role: 'Small Group Leader',team: 'Small Groups',      availability: 'Wed evenings',  bgCheck: 'Approved', schedulingNotes: 'Young adults group', createdAt: today(-200) },
      { id: uid(), memberId: '', name: 'David Martinez', role: 'Youth Leader',      team: 'Youth Ministry',    availability: 'Sundays + Fri', bgCheck: 'Approved', schedulingNotes: 'Leads Friday night youth', createdAt: today(-200) },
    ];
    saveAll('volunteers', volunteers);
  }

  function _seedPrayer() {
    const prayer = [
      { id: uid(), request: 'Please pray for the Harris family as John recovers from surgery.', category: 'Health',    status: 'Ongoing',  submittedBy: 'Anonymous', date: today(-8),  assignedTeam: 'Prayer Team', private: false, createdAt: today(-8) },
      { id: uid(), request: 'Prayers for our youth group mission trip preparation.', category: 'Ministry',  status: 'Ongoing',  submittedBy: 'David Martinez', date: today(-5), assignedTeam: 'Prayer Team', private: false, createdAt: today(-5) },
      { id: uid(), request: 'Pray for guidance on the building expansion plans.', category: 'Church',    status: 'New',      submittedBy: 'Pastor Wilson', date: today(-2),  assignedTeam: '', private: false, createdAt: today(-2) },
      { id: uid(), request: 'Private prayer request submitted for a family situation.', category: 'Family',    status: 'New',      submittedBy: 'Anonymous', date: today(-1),  assignedTeam: 'Prayer Team', private: true, createdAt: today(-1) },
      { id: uid(), request: 'Praise report — the Rodriguez family found housing after weeks of prayer!', category: 'Praise',    status: 'Answered', submittedBy: 'Nancy Garcia', date: today(-14), assignedTeam: '', private: false, createdAt: today(-14) },
      { id: uid(), request: 'Continued prayers for Patricia\'s health and strength.', category: 'Health',    status: 'Ongoing',  submittedBy: 'Dorothy White', date: today(-20), assignedTeam: 'Prayer Team', private: false, createdAt: today(-20) },
      { id: uid(), request: 'Prayer for new visitors to find their home here at Grace.', category: 'Evangelism', status: 'Ongoing',  submittedBy: 'Pastor Wilson', date: today(-30), assignedTeam: '', private: false, createdAt: today(-30) },
    ];
    saveAll('prayer', prayer);
  }

  function _seedEvents() {
    const events = [
      { id: uid(), name: 'Sunday Morning Worship',    date: today(6),  time: '10:00 AM', location: 'Main Sanctuary',       volunteersNeeded: 12, budget: 0,    attendance: 0,   description: 'Weekly worship service', recurring: 'Weekly', createdAt: today(-30) },
      { id: uid(), name: 'Wednesday Bible Study',     date: today(3),  time: '7:00 PM',  location: 'Fellowship Hall',       volunteersNeeded: 2,  budget: 0,    attendance: 0,   description: 'Midweek Bible study', recurring: 'Weekly', createdAt: today(-30) },
      { id: uid(), name: 'Youth Group Friday Night',  date: today(4),  time: '6:30 PM',  location: 'Youth Room',            volunteersNeeded: 4,  budget: 150,  attendance: 0,   description: 'Youth group hangout and devotional', recurring: 'Weekly', createdAt: today(-30) },
      { id: uid(), name: 'Community Food Drive',      date: today(10), time: '9:00 AM',  location: 'Church Parking Lot',   volunteersNeeded: 20, budget: 500,  attendance: 0,   description: 'Quarterly food drive for our food pantry', recurring: 'None', createdAt: today(-10) },
      { id: uid(), name: 'VBS Planning Meeting',      date: today(14), time: '6:00 PM',  location: 'Conference Room',      volunteersNeeded: 8,  budget: 0,    attendance: 0,   description: 'Plan summer Vacation Bible School', recurring: 'None', createdAt: today(-5) },
      { id: uid(), name: 'Men\'s Breakfast',          date: today(7),  time: '8:00 AM',  location: 'Fellowship Hall',      volunteersNeeded: 3,  budget: 200,  attendance: 0,   description: 'Monthly men\'s fellowship breakfast', recurring: 'Monthly', createdAt: today(-15) },
      { id: uid(), name: 'Summer Mission Trip',       date: today(45), time: '5:00 AM',  location: 'Departure from Church',volunteersNeeded: 15, budget: 8000, attendance: 0,   description: 'Youth & adults serving in Appalachia', recurring: 'None', createdAt: today(-20) },
      { id: uid(), name: 'Vacation Bible School',     date: today(60), time: '9:00 AM',  location: 'Main Campus',          volunteersNeeded: 25, budget: 2500, attendance: 0,   description: 'Annual VBS for children ages 3-12', recurring: 'None', createdAt: today(-20) },
      // Past events (for attendance records)
      { id: uid(), name: 'Sunday Morning Worship',    date: today(-7), time: '10:00 AM', location: 'Main Sanctuary',       volunteersNeeded: 12, budget: 0,    attendance: 127, description: '', recurring: 'Weekly', createdAt: today(-60) },
      { id: uid(), name: 'Sunday Morning Worship',    date: today(-14),time: '10:00 AM', location: 'Main Sanctuary',       volunteersNeeded: 12, budget: 0,    attendance: 134, description: '', recurring: 'Weekly', createdAt: today(-60) },
      { id: uid(), name: 'Sunday Morning Worship',    date: today(-21),time: '10:00 AM', location: 'Main Sanctuary',       volunteersNeeded: 12, budget: 0,    attendance: 119, description: '', recurring: 'Weekly', createdAt: today(-60) },
      { id: uid(), name: 'Sunday Morning Worship',    date: today(-28),time: '10:00 AM', location: 'Main Sanctuary',       volunteersNeeded: 12, budget: 0,    attendance: 142, description: '', recurring: 'Weekly', createdAt: today(-60) },
      { id: uid(), name: 'Easter Sunday Service',     date: today(-42),time: '9:00 AM',  location: 'Main Sanctuary',       volunteersNeeded: 18, budget: 300,  attendance: 218, description: 'Special Easter service', recurring: 'None', createdAt: today(-90) },
    ];
    saveAll('events', events);
  }

  function _seedFoodPantry() {
    const distributions = [
      { id: uid(), date: today(-2),  familiesServed: 34, individualServed: 89, volunteerHours: 18, items: ['Canned goods', 'Bread', 'Produce', 'Dairy'], notes: 'Record turnout this week', createdAt: today(-2) },
      { id: uid(), date: today(-9),  familiesServed: 28, individualServed: 74, volunteerHours: 14, items: ['Canned goods', 'Pasta', 'Cereal'], notes: '', createdAt: today(-9) },
      { id: uid(), date: today(-16), familiesServed: 31, individualServed: 82, volunteerHours: 15, items: ['Canned goods', 'Bread', 'Protein'], notes: '', createdAt: today(-16) },
      { id: uid(), date: today(-23), familiesServed: 25, individualServed: 68, volunteerHours: 12, items: ['Canned goods', 'Produce'], notes: 'Low on protein items', createdAt: today(-23) },
      { id: uid(), date: today(-30), familiesServed: 29, individualServed: 77, volunteerHours: 16, items: ['Canned goods', 'Bread', 'Dairy'], notes: '', createdAt: today(-30) },
    ];
    saveAll('foodpantry', distributions);
  }

  function _seedCare() {
    const care = [
      { id: uid(), name: 'John & Mary Harris',  type: 'Hospital Visit', date: today(-3),  status: 'Completed', assignedTo: 'Pastor Wilson', notes: 'John recovering from hip surgery. Visited and prayed together. Follow-up next week.', createdAt: today(-3) },
      { id: uid(), name: 'Patricia Davis',       type: 'Home Visit',     date: today(-10), status: 'Completed', assignedTo: 'Dorothy White', notes: 'Brought meal. Patricia appreciated the company. Needs ongoing check-ins.', createdAt: today(-10) },
      { id: uid(), name: 'The Murphy Family',    type: 'Counseling',     date: today(2),   status: 'Scheduled', assignedTo: 'Pastor Wilson', notes: 'Marriage counseling session #3. Going well.', createdAt: today(-5) },
      { id: uid(), name: 'Greg Foster',          type: 'Mentoring',      date: today(5),   status: 'Scheduled', assignedTo: 'David Martinez', notes: 'Monthly discipleship meetup at coffee shop.', createdAt: today(-2) },
      { id: uid(), name: 'Robert & June Hall',   type: 'Welcome Visit',  date: today(1),   status: 'Scheduled', assignedTo: 'Helen Robinson', notes: 'New visitors — welcome basket delivery and introduction.', createdAt: today(-1) },
      { id: uid(), name: 'Dorothy White',        type: 'Benevolence',    date: today(-5),  status: 'Completed', assignedTo: 'Michael Thompson', notes: 'Assisted with utility bill. Benevolence fund used.', createdAt: today(-5) },
    ];
    saveAll('care', care);
  }

  function _seedTasks() {
    const tasks = [
      { id: uid(), title: 'Order VBS curriculum',          owner: 'Angela Lee',     dueDate: today(7),  status: 'Todo',        priority: 'High',   description: 'Order from LifeWay — need for June VBS', createdAt: today(-2) },
      { id: uid(), title: 'Update church website events',  owner: 'Eric Harris',    dueDate: today(3),  status: 'In Progress', priority: 'Medium', description: 'Add summer events to the website calendar', createdAt: today(-3) },
      { id: uid(), title: 'Schedule volunteer training',   owner: 'Michael Thompson',dueDate: today(14),status: 'Todo',        priority: 'High',   description: 'Children\'s ministry volunteer training session', createdAt: today(-1) },
      { id: uid(), title: 'Repair sound board cable',      owner: 'Kevin Brown',    dueDate: today(2),  status: 'In Progress', priority: 'High',   description: 'Right channel intermittent — replace XLR cable on mixer', createdAt: today(-4) },
      { id: uid(), title: 'Send June newsletter',          owner: 'Pastor Wilson',  dueDate: today(5),  status: 'Todo',        priority: 'Medium', description: 'Compile articles and send to congregation', createdAt: today(-2) },
      { id: uid(), title: 'Food pantry inventory count',   owner: 'Nancy Garcia',   dueDate: today(1),  status: 'In Progress', priority: 'Medium', description: 'Monthly inventory of all pantry items', createdAt: today(-1) },
      { id: uid(), title: 'Background check — Carlos G.',  owner: 'Robert Jackson', dueDate: today(4),  status: 'Todo',        priority: 'High',   description: 'Background check renewal through Ministry Safe', createdAt: today(-3) },
      { id: uid(), title: 'Plan outdoor worship service',  owner: 'Susan Anderson', dueDate: today(20), status: 'Todo',        priority: 'Low',    description: 'Coordinate summer outdoor service for August', createdAt: today(-7) },
      { id: uid(), title: 'Clean and repaint nursery',     owner: 'Carol Clark',    dueDate: today(-5), status: 'Done',        priority: 'Medium', description: 'Annual nursery refresh', createdAt: today(-30) },
      { id: uid(), title: 'Print visitor welcome packets', owner: 'Helen Robinson', dueDate: today(-3), status: 'Done',        priority: 'Medium', description: 'Print 50 copies of the updated welcome packet', createdAt: today(-10) },
    ];
    saveAll('tasks', tasks);
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    get, set, remove,
    getAll, saveAll, findById, insert, update, removeItem: remove_item,
    getSettings, saveSettings,
    exportAll, importAll,
    seedIfEmpty,
    uid, today,
  };

})();
