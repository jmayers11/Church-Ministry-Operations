/* =============================================================
   volunteer-center.js  —  Volunteer Service Center + Matching
   ============================================================= */

(function seedVolunteerCenter() {
  if (Storage.get('_volcenter_seeded')) return;
  const uid = Storage.uid;
  // Enrich existing volunteers with skills/interests — stored separately
  const profiles = [
    { id: uid(), name: 'Kevin Brown',     skills: ['Audio Engineering','Sound Mixing','Video Production'], interests: ['Worship Team','Youth','Media'],       certifications: ['CPR'],             bgCheck: 'Approved', availability: ['Sunday','Wednesday'], hoursPerMonth: 8  },
    { id: uid(), name: 'Angela Lee',      skills: ['Early Childhood Education','First Aid','CPR'],         interests: ["Children's Ministry",'Nursery'],       certifications: ['CPR','First Aid'],   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 6  },
    { id: uid(), name: 'Maria Martinez',  skills: ['Vocal Performance','Piano','Music Theory'],            interests: ['Worship Team','Music Ministry'],       certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Rehearsals'], hoursPerMonth: 10 },
    { id: uid(), name: 'Susan Anderson',  skills: ['Choral Direction','Music Education','Piano'],          interests: ['Worship Team','Music Ministry'],       certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Wednesday'],  hoursPerMonth: 12 },
    { id: uid(), name: 'Carol Clark',     skills: ['Elementary Education','Curriculum Development'],       interests: ["Children's Ministry",'VBS'],           certifications: ['CPR','Background'],  bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 6  },
    { id: uid(), name: 'Nancy Garcia',    skills: ['Food Service','Inventory Management','Logistics'],     interests: ['Food Pantry','Outreach','Community'],  certifications: ['Food Handler'],     bgCheck: 'Approved', availability: ['Tue','Thu','Sat'],    hoursPerMonth: 20 },
    { id: uid(), name: 'Carlos Garcia',   skills: ['Bilingual (Spanish)','Physical Labor','Driving'],      interests: ['Outreach','Food Pantry','Community'],  certifications: [],                   bgCheck: 'Pending',  availability: ['Saturday'],           hoursPerMonth: 8  },
    { id: uid(), name: 'Frank Rivera',    skills: ['Security','Firearms Certified','CPR','First Aid'],     interests: ['Security','Safety'],                   certifications: ['CPR','Security'],   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
    { id: uid(), name: 'Dorothy White',   skills: ['Hospitality','Cooking','Visitation'],                  interests: ['Hospitality','Care Ministry','Widow Care'], certifications: ['CPR'],          bgCheck: 'Approved', availability: ['Sunday','Flexible'],  hoursPerMonth: 10 },
    { id: uid(), name: 'Helen Robinson',  skills: ['Greeting','Hospitality','Visitor Welcome'],            interests: ['Hospitality','Visitor Follow-Up'],     certifications: [],                   bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
    { id: uid(), name: 'David Martinez',  skills: ['Youth Ministry','Mentoring','Teaching','Bilingual'],   interests: ['Youth','Outreach','Mentoring'],         certifications: ['CPR'],              bgCheck: 'Approved', availability: ['Sunday','Friday'],    hoursPerMonth: 16 },
    { id: uid(), name: 'Brian Taylor',    skills: ['Small Group Facilitation','Teaching','Counseling'],    interests: ['Small Groups','Mentoring'],             certifications: [],                   bgCheck: 'Approved', availability: ['Wednesday'],          hoursPerMonth: 8  },
    { id: uid(), name: 'Eric Harris',     skills: ['Video Editing','Graphic Design','Social Media'],       interests: ['Media','Youth','Audio/Visual'],         certifications: [],                   bgCheck: 'Approved', availability: ['Sunday','Flexible'],  hoursPerMonth: 6  },
    { id: uid(), name: 'Gloria Cooper',   skills: ['Case Management','Social Work','Benevolence'],         interests: ['Care Ministry','Family Assistance'],    certifications: ['Social Work'],      bgCheck: 'Approved', availability: ['Flexible'],           hoursPerMonth: 10 },
    { id: uid(), name: 'Linda Thompson',  skills: ['Check-In Systems','Administration','Children'],        interests: ["Children's Ministry",'Administration'],certifications: ['CPR'],              bgCheck: 'Approved', availability: ['Sunday'],             hoursPerMonth: 4  },
  ];
  Storage.saveAll('volunteer_profiles', profiles);
  Storage.set('_volcenter_seeded', true);
})();

/* Navigation.register removed — functionality merged into volunteers.js */

const VolCenter = {
  _state: { search: '' },
  _rerender() {
    const _s = document.getElementById('vc-search');
    if (_s) VolCenter._state.search = _s.value;
    VolCenter._rerender();
    const _ns = document.getElementById('vc-search');
    if (_ns && VolCenter._state.search) { _ns.value = VolCenter._state.search; _ns.dispatchEvent(new Event('input')); }
  },
  _form(p={}) {
    return `
      <div class="form-group"><label class="form-label">Volunteer Name *</label>
        <input class="form-control" id="vc-name" value="${UI.esc(p.name||'')}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Background Check</label>
          <select class="form-control" id="vc-bg">
            ${['Approved','Pending','Expired','Not Required'].map(s=>`<option ${p.bgCheck===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Hours Per Month</label>
          <input class="form-control" id="vc-hrs" type="number" min="0" value="${p.hoursPerMonth||0}">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Availability (comma-separated)</label>
        <input class="form-control" id="vc-avail" value="${UI.esc((p.availability||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Skills (comma-separated)</label>
        <input class="form-control" id="vc-skills" value="${UI.esc((p.skills||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Ministry Interests (comma-separated)</label>
        <input class="form-control" id="vc-interests" value="${UI.esc((p.interests||[]).join(', '))}">
      </div>
      <div class="form-group"><label class="form-label">Certifications (comma-separated)</label>
        <input class="form-control" id="vc-certs" value="${UI.esc((p.certifications||[]).join(', '))}">
      </div>`;
  },
  _collect() {
    const csv = id => document.getElementById(id)?.value.split(',').map(s=>s.trim()).filter(Boolean);
    return {
      name:          document.getElementById('vc-name')?.value.trim(),
      bgCheck:       document.getElementById('vc-bg')?.value,
      hoursPerMonth: parseInt(document.getElementById('vc-hrs')?.value)||0,
      availability:  csv('vc-avail'),
      skills:        csv('vc-skills'),
      interests:     csv('vc-interests'),
      certifications:csv('vc-certs'),
    };
  },
  add() {
    Modal.open({ title:'+ Volunteer Profile', body:this._form(), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vc-btn">Save</button>` });
    document.getElementById('save-vc-btn').onclick = () => {
      const d=this._collect();
      if(!Validate.check([
        ['vc-name', Validate.required(d.name,'Volunteer name')],
      ])) return;
      Storage.insert('volunteer_profiles',d); Modal.close(); Toast.success('Profile added'); VolCenter._rerender();
    };
  },
  edit(id) {
    const p=Storage.findById('volunteer_profiles',id); if(!p) return;
    Modal.open({ title:'Edit Profile', body:this._form(p), width:'500px',
      footer:`<button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
              <button class="btn btn-primary" id="save-vc-btn">Save</button>` });
    document.getElementById('save-vc-btn').onclick = () => {
      Storage.update('volunteer_profiles',id,this._collect()); Modal.close(); Toast.success('Updated'); VolCenter._rerender();
    };
  },
  remove(id) {
    UI.confirm('Remove this volunteer profile?',()=>{ Storage.removeItem('volunteer_profiles',id); Toast.success('Removed'); VolCenter._rerender(); });
  },
};
window.VolCenter = VolCenter;
