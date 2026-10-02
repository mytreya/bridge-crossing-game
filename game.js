(() => {
  const people = [
    { id: 'star', name: 'Freshman Track Star', short: 'Track Star', time: 1, emoji: '🏃', cls: 'card-red' },
    { id: 'design', name: 'Fashion Design Student', short: 'Design Student', time: 2, emoji: '🧑‍💻', cls: 'card-purple' },
    { id: 'ta', name: 'Teaching Assistant', short: 'Teaching Assistant', time: 5, emoji: '🧑‍🏫', cls: 'card-green' },
    { id: 'prof', name: 'Professor', short: 'Professor', time: 10, emoji: '👨‍🏫', cls: 'card-gold' }
  ];
  const OPTIMAL = 17;
  const state = {
    sides: Object.fromEntries(people.map(p => [p.id, 'left'])),
    flashlight: 'left',
    selected: [],
    time: 0,
    moves: [],
    sound: true,
    busy: false,
    hints: 0
  };

  const el = id => document.getElementById(id);
  const cards = el('characterCards');
  const leftPeople = el('leftPeople');
  const rightPeople = el('rightPeople');
  const selectedSlots = el('selectedSlots');
  const crossBtn = el('crossBtn');
  const timeValue = el('timeValue');
  const moveLog = el('moveLog');
  const feedback = el('feedback');
  const feedbackEmoji = el('feedbackEmoji');
  const feedbackTitle = el('feedbackTitle');
  const feedbackText = el('feedbackText');
  const bridge = el('bridge');
  const crossers = el('crossers');
  const flashBeam = el('flashBeam');
  const sfxCreak = el('sfxCreak');
  const sfxWobble = el('sfxWobble');
  const modalBackdrop = el('modalBackdrop');

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span');
    p.className = 'plank';
    p.style.setProperty('--r', `${(i % 3 - 1) * 2.3}deg`);
    el('planks').appendChild(p);
  }

  function render() {
    renderCards();
    renderBanks();
    renderSelected();
    renderLog();
    timeValue.textContent = state.time;
    const dir = state.flashlight === 'left' ? 'Send Across ➜' : '⬅ Bring Back';
    crossBtn.textContent = dir;
    crossBtn.disabled = state.selected.length === 0 || state.busy;
  }

  function renderCards() {
    cards.innerHTML = '';
    people.forEach(p => {
      const available = state.sides[p.id] === state.flashlight;
      const selected = state.selected.includes(p.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `character-card ${p.cls}${selected ? ' selected' : ''}${available ? '' : ' unavailable'}`;
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      btn.setAttribute('aria-label', `${p.name}, ${p.time} minute${p.time === 1 ? '' : 's'}${available ? '' : ', not on the flashlight side'}`);
      btn.disabled = state.busy;
      btn.innerHTML = `<span class="avatar" aria-hidden="true">${p.emoji}</span><span><span class="char-name">${p.name}</span><span class="char-time">${p.time} minute${p.time === 1 ? '' : 's'}</span></span><span class="checkbox-dot" aria-hidden="true"></span>`;
      btn.addEventListener('click', () => togglePerson(p.id));
      cards.appendChild(btn);
    });
  }

  function renderBanks() {
    leftPeople.innerHTML = '';
    rightPeople.innerHTML = '';
    people.forEach(p => {
      const node = document.createElement('div');
      node.className = 'person-token';
      node.innerHTML = `<span class="head" aria-hidden="true">${p.emoji}</span><span>${p.short}</span>`;
      (state.sides[p.id] === 'left' ? leftPeople : rightPeople).appendChild(node);
    });
  }

  function renderSelected() {
    selectedSlots.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      const person = people.find(p => p.id === state.selected[i]);
      if (person) {
        slot.classList.add('filled');
        slot.innerHTML = `<span><span class="big" aria-hidden="true">${person.emoji}</span>${person.short}<br>${person.time} min</span>`;
      } else slot.textContent = '+';
      selectedSlots.appendChild(slot);
    }
  }

  function renderLog() {
    moveLog.innerHTML = '';
    state.moves.forEach((m, i) => {
      const li = document.createElement('li');
      const arrow = m.from === 'left' ? '➜' : '⬅';
      li.innerHTML = `<strong>${m.names.join(' + ')}</strong> ${arrow} ${m.cost} min <span aria-label="total time">• total ${m.total}</span>`;
      moveLog.appendChild(li);
    });
  }

  function togglePerson(id) {
    if (state.busy) return;
    if (state.sides[id] !== state.flashlight) {
      setFeedback('bad', '🚫', 'Wrong side!', 'Pick someone standing with the flashlight.');
      boing();
      return;
    }
    const idx = state.selected.indexOf(id);
    if (idx >= 0) state.selected.splice(idx, 1);
    else if (state.selected.length < 2) state.selected.push(id);
    else {
      setFeedback('bad', '👫', 'Only two!', 'The bridge can only hold two people at once.');
      boing();
    }
    render();
  }

  async function makeMove() {
    if (state.busy || state.selected.length === 0) return;
    const travelers = state.selected.map(id => people.find(p => p.id === id));
    if (travelers.some(p => state.sides[p.id] !== state.flashlight)) return;
    state.busy = true;
    crossBtn.disabled = true;
    setFeedback('', '🌉', 'Hold on!', `${travelers.map(p => p.short).join(' + ')} are crossing…`);
    await animateCrossing(travelers, state.flashlight);

    const from = state.flashlight;
    const to = from === 'left' ? 'right' : 'left';
    travelers.forEach(p => state.sides[p.id] = to);
    const cost = Math.max(...travelers.map(p => p.time));
    state.time += cost;
    state.flashlight = to;
    state.moves.push({ from, names: travelers.map(p => p.short), cost, total: state.time });
    state.selected = [];
    state.busy = false;
    render();

    if (people.every(p => state.sides[p.id] === 'right')) finishGame();
    else {
      const who = travelers.length === 1 ? travelers[0].short : `${travelers[0].short} and ${travelers[1].short}`;
      setFeedback('good', '🔦', `${cost} minute${cost === 1 ? '' : 's'} used`, `${who} made it across. The flashlight is now on the ${to} side.`);
      chirp();
    }
  }

  function animateCrossing(travelers, from) {
    return new Promise(resolve => {
      crossers.innerHTML = travelers.map(p => `<span class="crosser" aria-hidden="true">${p.emoji}</span>`).join('');
      crossers.className = `crossers ${from === 'left' ? 'go-right' : 'go-left'}`;
      bridge.classList.add('shaking');
      flashBeam.classList.add('on');
      sfxCreak.classList.add('show');
      sfxWobble.classList.add('show');
      creak();
      setTimeout(() => wobble(), 480);
      setTimeout(() => stepSound(), 900);
      setTimeout(() => {
        crossers.className = 'crossers';
        crossers.innerHTML = '';
        bridge.classList.remove('shaking');
        flashBeam.classList.remove('on');
        sfxCreak.classList.remove('show');
        sfxWobble.classList.remove('show');
        resolve();
      }, prefersReducedMotion() ? 120 : 1850);
    });
  }

  function finishGame() {
    const optimal = state.time === OPTIMAL;
    const under = state.time < OPTIMAL;
    if (optimal) {
      modalBackdrop.hidden = false;
      el('resultFace').textContent = '🏆';
      el('resultTitle').textContent = 'You won! This is the fastest!';
      el('resultText').textContent = 'Perfect crossing! You found the fastest solution. Ta-da!';
      setFeedback('good', '🎉', 'Perfect!', 'Everyone crossed in the fastest possible time');
      fanfare();
    } else if (under) {
      // Defensive: should be impossible with the puzzle rules.
      modalBackdrop.hidden = false;
      el('resultFace').textContent = '🧠';
      el('resultTitle').textContent = 'Amazing!';
      el('resultText').textContent = `You finished in ${state.time} minutes. That is unexpectedly fast — check the move log!`;
      fanfare();
    } else {
      modalBackdrop.hidden = false;
      el('resultFace').textContent = '😄';
      el('resultTitle').textContent = 'Everyone made it… but not fastest!';
      el('resultText').textContent = `You took ${state.time} minutes. Can you beat that and reach faster?`;
      setFeedback('bad', '⏱️', 'So close!', `Everyone crossed in ${state.time} minutes. Try a different combination to reach 17.`);
      wahWah();
    }
  }

  function resetGame(closeModal = true) {
    Object.assign(state, {
      sides: Object.fromEntries(people.map(p => [p.id, 'left'])),
      flashlight: 'left', selected: [], time: 0, moves: [], busy: false, hints: 0
    });
    if (closeModal) modalBackdrop.hidden = true;
    setFeedback('', '🔦', 'Pick your travelers!', 'Choose one or two people standing with the flashlight.');
    render();
  }

  function showHint() {
    const hints = [
      'Hint 1: Your two fastest people are very useful for carrying the flashlight back.',
      'Hint 2: Try getting the two slowest people across together, so you only pay the 10-minute cost once.',
      'Hint 3: A strong start is sending the 1-minute and 2-minute travelers across together.'
    ];
    const msg = hints[Math.min(state.hints, hints.length - 1)];
    state.hints++;
    setFeedback('good', '💡', 'Hint', msg);
    twinkle();
  }

  function setFeedback(kind, emoji, title, text) {
    feedback.className = `feedback${kind ? ' ' + kind : ''}`;
    feedbackEmoji.textContent = emoji;
    feedbackTitle.textContent = title;
    feedbackText.textContent = text;
  }

  function prefersReducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  // Tiny synthesized sound effects: no external audio files needed.
  let audioCtx = null;
  function ctx() {
    if (!state.sound) return null;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, duration=.1, type='sine', gain=.05, start=0) {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + .01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
    o.connect(g).connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + duration + .02);
  }
  function noise(duration=.2, gain=.035) {
    const c = ctx(); if (!c) return;
    const length = Math.floor(c.sampleRate * duration), buffer = c.createBuffer(1, length, c.sampleRate), data = buffer.getChannelData(0);
    for (let i=0;i<length;i++) data[i] = (Math.random()*2-1) * (1-i/length);
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buffer; filter.type='bandpass'; filter.frequency.value=650; filter.Q.value=.8; g.gain.value=gain;
    src.connect(filter).connect(g).connect(c.destination); src.start();
  }
  function creak(){ noise(.35,.05); tone(130,.34,'sawtooth',.025); }
  function wobble(){ tone(240,.08,'square',.04); tone(190,.11,'square',.035,.08); }
  function stepSound(){ tone(420,.06,'triangle',.025); tone(360,.06,'triangle',.025,.12); tone(430,.06,'triangle',.025,.24); }
  function boing(){ tone(180,.08,'sine',.06); tone(420,.18,'sine',.05,.07); }
  function chirp(){ tone(520,.07,'sine',.04); tone(700,.08,'sine',.035,.08); }
  function twinkle(){ tone(660,.08,'sine',.035); tone(880,.11,'sine',.035,.08); }
  function wahWah(){ tone(310,.18,'sawtooth',.035); tone(220,.22,'sawtooth',.03,.17); tone(150,.28,'sawtooth',.025,.36); }
  function fanfare(){ [523,659,784,1047].forEach((f,i)=>tone(f,.24,'triangle',.055,i*.11)); }

  crossBtn.addEventListener(
    'click',
    async () => {
      if (window.innerWidth <= 700) {
        bridge.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'center'
        });
  
        await new Promise(resolve =>
          setTimeout(
            resolve,
            prefersReducedMotion() ? 50 : 450
          )
        );
      }
  
      makeMove();
    }
  );
  el('resetBtn').addEventListener('click', () => resetGame());
  el('clearBtn').addEventListener('click', () => {
    if (state.busy) return;
    state.moves = []; renderLog();
    setFeedback('', '🧹', 'Move log cleared', 'Your current positions and total time are unchanged.');
  });
  el('hintBtn').addEventListener('click', showHint);
  el('soundBtn').addEventListener('click', () => {
    state.sound = !state.sound;
    el('soundBtn').setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    el('soundBtn').setAttribute('aria-label', state.sound ? 'Turn sound off' : 'Turn sound on');
    el('soundIcon').textContent = state.sound ? '🔊' : '🔇';
    el('soundText').textContent = state.sound ? 'Sound on' : 'Sound off';
    if (state.sound) chirp();
  });
  el('playAgainBtn').addEventListener('click', () => resetGame());
  el('keepBtn').addEventListener('click', () => { modalBackdrop.hidden = true; el('game').focus(); });
  modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) modalBackdrop.hidden = true; });

  render();
})();
