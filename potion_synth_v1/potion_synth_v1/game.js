
// Simple integrated demo: drag herbs, grind (optional), cook in window, get score.
(() => {
  const ING = [
    {id:'mint', name:'민트', color:'#6ee7b7'},
    {id:'lavender', name:'라벤더', color:'#c084fc'},
    {id:'sage', name:'세이지', color:'#a7f3d0'},
    {id:'ember', name:'불씨', color:'#f97316'},
    {id:'iceberry', name:'얼음열매', color:'#93c5fd'},
    {id:'stardust', name:'별가루', color:'#eab308'},
  ];
  const POTIONS = {
    power: { name:'힘의 포션', pool:['sage','ember','stardust','mint'] },
    speed: { name:'속도의 포션', pool:['mint','lavender','stardust','iceberry'] },
    health:{ name:'체력의 포션', pool:['sage','mint','iceberry','stardust'] }
  };

  // Mount UI elements dynamically
  const scene = document.querySelector('.scene');
  const hud = document.createElement('div');
  hud.className = 'ui';
  hud.innerHTML = `
    <div id="order" class="panel order">
      <div class="title">주문서</div>
      <div class="potion-row">
        <button class="btn" data-potion="power">힘</button>
        <button class="btn" data-potion="speed">속도</button>
        <button class="btn" data-potion="health">체력</button>
      </div>
      <div class="recipe"></div>
    </div>
    <div id="added" class="panel added">
      <div class="title">투입 재료</div>
      <ul class="list"></ul>
    </div>
    <div id="cook" class="panel cook">
      <div class="title">가열</div>
      <div class="bar">
        <div class="ok"></div>
        <div class="tick"></div>
      </div>
      <div class="ctrls">
        <button id="btnStart" class="btn">끓이기 시작</button>
        <button id="btnStop" class="btn" disabled>불 끄기</button>
        <button id="btnFinish" class="btn" disabled>완성</button>
        <button id="btnReset" class="btn subtle">초기화</button>
      </div>
      <div class="hint"></div>
    </div>
    <div id="result" class="modal hidden">
      <div class="box">
        <div class="title">결과</div>
        <div class="body"></div>
        <div class="row">
          <button class="btn" id="btnRetry">같은 포션 재도전</button>
          <button class="btn" id="btnBack">다른 포션</button>
          <button class="btn subtle" id="btnClose">닫기</button>
        </div>
      </div>
    </div>
  `;
  scene.appendChild(hud);

  // Create herb icons on the shelf
  const shelf = document.querySelector('.layer.shelf');
  const herbLayer = document.createElement('div');
  herbLayer.className = 'herb-layer';
  shelf.appendChild(herbLayer);

  function placeHerbs() {
    herbLayer.innerHTML = '';
    const spots = [
      [8,6],[28,6],[50,6],[70,6],
      [8,30],[28,30],[50,30],[70,30]
    ];
    ING.forEach((ing,i) => {
      const [x,y] = spots[i%spots.length];
      const el = document.createElement('div');
      el.className = 'herb';
      el.style.left = `calc(${x}px * var(--scale))`;
      el.style.top = `calc(${y}px * var(--scale))`;
      el.style.background = ing.color;
      el.title = ing.name;
      el.draggable = true;
      el.dataset.id = ing.id;
      el.addEventListener('dragstart', (ev)=>{
        ev.dataTransfer.setData('text/plain', JSON.stringify({type:'herb', id:ing.id}));
      });
      herbLayer.appendChild(el);
    });
  }
  placeHerbs();

  // Mortar: drop to grind
  const mortar = document.querySelector('.layer.mortar');
  mortar.addEventListener('dragover', e=>e.preventDefault());
  mortar.addEventListener('drop', e=>{
    e.preventDefault();
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')||'{}'); } catch(_){}
    if(!data || (data.type!=='herb')) return;
    const ing = ING.find(i=>i.id===data.id);
    spawnPowder(ing);
    flashHint('절구에서 분쇄됨 → 가마솥에 투입하면 보너스!', 'cook');
  });

  function spawnPowder(ing){
    const p = document.createElement('div');
    p.className = 'powder';
    p.style.background = ing.color;
    p.draggable = true;
    p.title = `${ing.name} 가루`;
    p.dataset.id = ing.id;
    p.addEventListener('dragstart', (ev)=>{
      ev.dataTransfer.setData('text/plain', JSON.stringify({type:'powder', id:ing.id}));
    });
    mortar.appendChild(p);
    // animate puff
    p.animate([{transform:'translateY(0) scale(0.6)', opacity:0},
               {transform:'translateY(-6px) scale(1)', opacity:1}], {duration:300, easing:'ease-out'});
    setTimeout(()=>p.classList.add('visible'), 10);
  }

  // Cauldron: drop herb or powder
  const cauldron = document.querySelector('.layer.cauldron');
  const dropzone = cauldron; // entire image
  dropzone.addEventListener('dragover', e=>e.preventDefault());
  dropzone.addEventListener('drop', e=>{
    e.preventDefault();
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')||'{}'); } catch(_){}
    if(!data || (data.type!=='herb' && data.type!=='powder')) return;
    const ing = ING.find(i=>i.id===data.id);
    addIngredient(ing.id, 1, data.type==='powder');
    bubble(ing.color);
  });

  // Added list
  const added = new Map();
  function renderAdded(){
    const ul = document.querySelector('#added .list');
    ul.innerHTML = '';
    Array.from(added.entries()).forEach(([id,info])=>{
      const ing = ING.find(i=>i.id===id);
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="swatch" style="background:${ing.color}"></span>
        <span class="name">${ing.name}${info.ground>0?'(가루)':''}</span>
        <span class="qty">x${info.count}</span>
        <button class="mini" data-act="minus">-</button>
        <button class="mini" data-act="plus">+</button>
        <button class="mini" data-act="del">×</button>
      `;
      li.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          if(btn.dataset.act==='minus') addIngredient(id, -1, false);
          if(btn.dataset.act==='plus') addIngredient(id, +1, false);
          if(btn.dataset.act==='del'){ added.delete(id); renderAdded(); }
        });
      });
      ul.appendChild(li);
    });
  }
  function addIngredient(id, delta=1, ground=false){
    if(!added.has(id)) added.set(id, {count:0, ground:0});
    const info = added.get(id);
    info.count = Math.max(0, info.count + delta);
    if(ground) info.ground += 1;
    if(info.count===0){ added.delete(id); }
    renderAdded();
  }

  // Bubbles visual
  function bubble(color){
    const b = document.createElement('span');
    b.className = 'bubble';
    b.style.background = color;
    cauldron.appendChild(b);
    b.animate([
      { transform:'translateY(0) scale(0.8)', opacity:0.9 },
      { transform:'translateY(-20px) scale(0.6)', opacity:0 }
    ], { duration:800, easing:'ease-out' }).onfinish = ()=> b.remove();
  }

  // Order/recipe handling
  let currentPotion = null;
  let recipe = null;
  const recipeDiv = document.querySelector('#order .recipe');
  document.querySelectorAll('#order .btn[data-potion]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      currentPotion = btn.dataset.potion;
      recipe = pickRecipe(POTIONS[currentPotion].pool);
      showRecipe(recipe);
      resetCook();
      flashHint('선반에서 재료를 가마솥에 드래그하세요. 절구에서 갈면 보너스!', 'order');
    });
  });
  function pickRecipe(pool){
    const n = 3 + Math.floor(Math.random()*2); // 3~4종
    const ids = [...pool];
    ids.sort(()=>Math.random()-0.5);
    const chosen = ids.slice(0,n);
    const out = {};
    chosen.forEach(id=> out[id] = 1 + Math.floor(Math.random()*3)); // 1~3개
    // cook window
    const center = 2.0 + Math.random()*2.0; // 2.0~4.0s
    const width = 0.7 + Math.random()*0.8; // 0.7~1.5s
    return { need: out, center, width };
  }
  function showRecipe(r){
    const list = Object.entries(r.need).map(([id,c])=>{
      const ing = ING.find(i=>i.id===id);
      return `<li><span class="swatch" style="background:${ing.color}"></span>${ing.name} x${c}</li>`;
    }).join('');
    recipeDiv.innerHTML = `
      <div class="subtitle">포션: ${POTIONS[currentPotion].name}</div>
      <ul class="bul">${list}</ul>
      <div class="subtitle">끓이기: <b>${r.center.toFixed(2)}s ± ${(r.width/2).toFixed(2)}s</b></div>
    `;
    // set ok band
    const ok = document.querySelector('.bar .ok');
    ok.style.left = `${Math.max(0,(r.center - r.width/2)/APP.cook.max*100)}%`;
    ok.style.width = `${(r.width/APP.cook.max)*100}%`;
  }

  // Cook/timer
  const APP = { cook: { t:0, max:6.0, running:false, startTime:0 } };
  const tickEl = document.querySelector('.bar .tick');
  const btnStart = document.getElementById('btnStart');
  const btnStop = document.getElementById('btnStop');
  const btnFinish = document.getElementById('btnFinish');
  const hintEl = document.querySelector('#cook .hint');

  function loop(){
    requestAnimationFrame(loop);
    if(APP.cook.running){
      const now = performance.now();
      APP.cook.t = (now - APP.cook.startTime)/1000;
      const pct = Math.min(100, (APP.cook.t/APP.cook.max)*100);
      tickEl.style.left = pct + '%';
      if(APP.cook.t >= APP.cook.max){
        stopCook();
      }
    }
  }
  loop();

  function startCook(){
    if(!recipe) return flashHint('먼저 포션을 선택해 주세요.', 'cook');
    APP.cook.running = true;
    APP.cook.startTime = performance.now();
    btnStart.disabled = true;
    btnStop.disabled = false;
    btnFinish.disabled = false;
    flashHint('적절한 타이밍에 불을 끄세요!', 'cook');
  }
  function stopCook(){
    if(!APP.cook.running) return;
    APP.cook.running = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    flashHint(`끓이기 종료: ${APP.cook.t.toFixed(2)}s`, 'cook');
  }
  function resetCook(){
    APP.cook.running = false;
    APP.cook.t = 0;
    tickEl.style.left = '0%';
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnFinish.disabled = true;
    added.clear(); renderAdded();
  }

  btnStart.addEventListener('click', startCook);
  btnStop.addEventListener('click', stopCook);
  btnFinish.addEventListener('click', ()=>{
    stopCook();
    showResult();
  });
  document.getElementById('btnReset').addEventListener('click', resetCook);

  // Result
  const modal = document.getElementById('result');
  const body = modal.querySelector('.body');
  document.getElementById('btnClose').addEventListener('click', ()=> modal.classList.add('hidden'));
  document.getElementById('btnBack').addEventListener('click', ()=>{
    modal.classList.add('hidden');
    document.querySelector('#order .potion-row').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('btnRetry').addEventListener('click', ()=>{
    modal.classList.add('hidden');
    resetCook();
  });

  function showResult(){
    if(!recipe){ flashHint('먼저 포션을 선택하세요.', 'order'); return; }
    // scoring
    let score = 100;
    let detail = [];

    // ingredients
    const need = recipe.need;
    for(const id of Object.keys(need)){
      const got = added.get(id)?.count || 0;
      const diff = Math.abs(got - need[id]);
      if(diff>0){
        const pen = diff * 6;
        score -= pen;
        detail.push(`${nameOf(id)} 수량 차이: ${diff}개 → -${pen}`);
      }
    }
    // extra wrong ingredients
    for(const [id,info] of added.entries()){
      if(!(id in need)){
        const pen = info.count * 6;
        score -= pen;
        detail.push(`${nameOf(id)}(불필요) x${info.count} → -${pen}`);
      }
    }

    // grind bonus
    let bonus = 0;
    for(const [id,info] of added.entries()){
      if(info.ground>0){
        const b = Math.min(info.ground, info.count) * 1; // +1 per ground
        bonus += b;
      }
    }
    score += bonus;
    if(bonus>0) detail.push(`분쇄 보너스 +${bonus}`);

    // time window
    const t = APP.cook.t;
    const left = recipe.center - recipe.width/2;
    const right = recipe.center + recipe.width/2;
    if(t < left){
      const miss = (left - t);
      const pen = Math.min(40, Math.round(miss*20));
      score -= pen;
      detail.push(`가열 부족(${t.toFixed(2)}s, 목표 ${left.toFixed(2)}~${right.toFixed(2)}s) → -${pen}`);
    } else if(t > right){
      const miss = (t - right);
      const pen = Math.min(40, Math.round(miss*20));
      score -= pen;
      detail.push(`과열(${t.toFixed(2)}s, 목표 ${left.toFixed(2)}~${right.toFixed(2)}s) → -${pen}`);
    } else {
      detail.push(`시간 정확도 양호(${t.toFixed(2)}s)`);
    }

    score = Math.max(0, Math.min(100, score));
    const grade = score>=95?'S': score>=80?'A': score>=60?'B':'C';

    body.innerHTML = `
      <div class="grade g-${grade}">${grade}</div>
      <div class="score">총점 ${score}</div>
      <div class="sep"></div>
      <div class="sub">레시피</div>
      <ul class="bul">${Object.entries(need).map(([id,c])=>`<li>${nameOf(id)} x${c}</li>`).join('')}</ul>
      <div class="sub">내 투입</div>
      <ul class="bul">${Array.from(added.entries()).map(([id,info])=>`<li>${nameOf(id)} x${info.count}${info.ground?` (가루 ${info.ground})`:''}</li>`).join('') || '<li>없음</li>'}</ul>
      <div class="sub">피드백</div>
      <ul class="bul">${detail.map(s=>`<li>${s}</li>`).join('')}</ul>
    `;
    modal.classList.remove('hidden');
  }

  function nameOf(id){ return ING.find(i=>i.id===id).name; }

  function flashHint(text, where){
    hintEl.textContent = text;
    hintEl.classList.add('show');
    setTimeout(()=> hintEl.classList.remove('show'), 2200);
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(e.key==='r' || e.key==='R'){ resetCook(); }
    if(e.key==='Enter' && !btnFinish.disabled){ btnFinish.click(); }
    if(e.key===' '){ e.preventDefault(); if(APP.cook.running) btnStop.click(); else btnStart.click(); }
  });

})();    
