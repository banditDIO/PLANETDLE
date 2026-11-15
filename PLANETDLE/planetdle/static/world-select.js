/* Accessible, shared world selector for guessing and Solar System navigation.
   Built without external dependencies; game forms continue to own submission. */
(() => {
  'use strict';
  const names = JSON.parse(document.getElementById('world-options-data')?.textContent || '[]');
  const planets = new Set(['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']);
  const moons = new Set(["Earth's Moon",'Io','Europa','Ganymede','Callisto','Titan','Enceladus','Triton']);
  const groups = [{key:'PLANETS', icon:'◉', names:names.filter(n=>planets.has(n))},
                  {key:'MOONS', icon:'☾', names:names.filter(n=>moons.has(n))},
                  {key:'DWARF PLANETS & SMALL BODIES', icon:'✦', names:names.filter(n=>!planets.has(n)&&!moons.has(n))}];
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[’‘]/g,"'").trim();
  const controls = [];
  document.querySelectorAll('[data-world-combo]').forEach((root, index) => {
    const input = root.querySelector('.world-combo-input');
    const panel = root.querySelector('.world-option-panel');
    const toggle = root.querySelector('.world-list-toggle');
    if (!input || !panel) return;
    let open = false, active = -1, visible = [];
    function close() {
      open = false; active = -1; panel.hidden = true;
      root.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function drawActive(scroll = true) {
      const options = panel.querySelectorAll('[role="option"]');
      options.forEach((el, i) => {
        el.classList.toggle('is-active', i === active);
        el.setAttribute('aria-selected', String(i === active));
      });
      if (active >= 0 && options[active]) {
        input.setAttribute('aria-activedescendant', options[active].id);
        if (scroll) options[active].scrollIntoView({block:'nearest'});
      } else input.removeAttribute('aria-activedescendant');
    }
    function select(name) {
      input.value = name;
      close();
      input.dispatchEvent(new Event('change', {bubbles:true}));
      input.focus({preventScroll:true});
    }
    function render() {
      const q = normalize(input.value);
      const filtered = groups.map(group => ({...group, names:group.names.filter(name=>normalize(name).includes(q))}));
      visible = filtered.flatMap(group=>group.names);
      panel.replaceChildren();
      const heading = document.createElement('div'); heading.className = 'world-option-meta';
      heading.textContent = q ? `${visible.length} MATCH${visible.length===1?'':'ES'} FOUND` : 'EXPLORE THE SOLAR SYSTEM · 21 WORLDS';
      panel.append(heading);
      if (!visible.length) {
        const empty = document.createElement('div'); empty.className = 'world-option-empty';
        empty.textContent = 'No matching world. Try a different name.'; panel.append(empty);
      }
      let cursor = 0;
      filtered.forEach(group=>{
        if(!group.names.length) return;
        const label=document.createElement('div'); label.className='world-option-group';
        label.textContent=`${group.icon}  ${group.key}`; panel.append(label);
        group.names.forEach(name=>{
          const item=document.createElement('div'); item.className='world-option';
          item.id=`${input.id}-item-${cursor++}`; item.setAttribute('role','option');
          item.setAttribute('aria-selected','false');
          const dot=document.createElement('span'); dot.className='world-option-dot';
          dot.dataset.group=group.key;
          const title=document.createElement('span'); title.className='world-option-title';
          const start=normalize(name).indexOf(q);
          if(q && start>=0){
            title.append(document.createTextNode(name.slice(0,start)));
            const mark=document.createElement('mark');mark.textContent=name.slice(start,start+q.length);
            title.append(mark,document.createTextNode(name.slice(start+q.length)));
          } else title.textContent=name;
          const type=document.createElement('span'); type.className='world-option-kind';
          type.textContent=group.key==='PLANETS'?'Planet':group.key==='MOONS'?'Moon':'Small body';
          item.append(dot,title,type);
          item.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse')e.preventDefault(); });
          item.addEventListener('click',()=>select(name));
          panel.append(item);
        });
      });
      active=-1;
    }
    function show() {
      controls.forEach(control=>{if(control.input!==input)control.close();});
      render(); open=true;panel.hidden=false;root.classList.add('is-open');
      input.setAttribute('aria-expanded','true');
    }
    input.addEventListener('focus',show);
    input.addEventListener('input',show);
    input.addEventListener('keydown',event=>{
      if (event.key === 'Escape' && open) {event.preventDefault();close();return;}
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); if(!open) show();
        if(visible.length){active=(active+(event.key==='ArrowDown'?1:-1)+visible.length)%visible.length;drawActive();}
        return;
      }
      if (event.key === 'Enter' && open && active>=0 && visible[active]) {
        event.preventDefault();event.stopPropagation();select(visible[active]);
        return;
      }
      if(event.key==='Tab')close();
    });
    toggle?.addEventListener('pointerdown',event=>event.preventDefault());
    toggle?.addEventListener('click',()=>{if(open){close();input.blur();}else{input.focus();show();}});
    document.addEventListener('pointerdown',event=>{if(!root.contains(event.target))close();});
    root.closest('form')?.addEventListener('submit',()=>close());
    controls.push({input,close});
  });
  window.PlanetdleWorldSelect = Object.freeze({names:[...names], closeAll:()=>controls.forEach(control=>control.close())});
})();
