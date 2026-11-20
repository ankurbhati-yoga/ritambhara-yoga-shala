(function () {
  'use strict';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-review-carousel]').forEach(function (panel) {
    var track = panel.querySelector('.review-track');
    var slides = Array.from(panel.querySelectorAll('.review-slide'));
    var controls = panel.querySelector('.review-controls');
    var previous = panel.querySelector('.review-previous');
    var next = panel.querySelector('.review-next');
    var play = panel.querySelector('.review-play');
    var position = panel.querySelector('.review-position');
    if (!track || slides.length < 2) return;
    var index = 0, timer = 0, scrollTimer = 0;
    // Visitors choose automatic sliding; text never moves before they opt in.
    var playing = false, hovering = false, visible = false;
    controls.hidden = false;
    function cardLeft(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }
    function canSlide() { return track.scrollWidth > track.clientWidth + 2; }
    function update() {
      var best = 0, distance = Infinity;
      slides.forEach(function (_, i) {
        var d = Math.abs(cardLeft(i) - track.scrollLeft);
        if (d < distance) { best = i; distance = d; }
      });
      index = best;
      position.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      controls.hidden = !canSlide();
    }
    function schedule() {
      clearTimeout(timer);
      if (!playing || hovering || !visible || document.hidden || motion.matches || !canSlide()) return;
      timer = setTimeout(function () { move(1, true); }, 10000);
    }
    function setPlaying(value) {
      playing = value && !motion.matches;
      play.hidden = motion.matches;
      play.textContent = playing ? 'Pause sliding' : 'Auto slide';
      play.setAttribute('aria-pressed', String(playing));
      schedule();
    }
    function move(direction, automatic) {
      if (!automatic) setPlaying(false);
      var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
      var target = direction > 0 && atEnd ? 0 : direction < 0 && track.scrollLeft < 3 ? slides.length - 1 : (index + direction + slides.length) % slides.length;
      track.setAttribute('aria-live', automatic ? 'off' : 'polite');
      track.scrollTo({left:cardLeft(target), behavior:motion.matches ? 'instant' : 'smooth'});
      schedule();
    }
    previous.addEventListener('click', function () { move(-1, false); });
    next.addEventListener('click', function () { move(1, false); });
    play.addEventListener('click', function () { setPlaying(!playing); });
    panel.addEventListener('focusin', function (event) {
      // WCAG carousel guidance: focus stops rotation, except the rotation control itself.
      if (event.target !== play) setPlaying(false);
    });
    panel.addEventListener('mouseenter', function () { hovering = true; schedule(); });
    panel.addEventListener('mouseleave', function () { hovering = false; schedule(); });
    track.addEventListener('pointerdown', function () { setPlaying(false); });
    track.addEventListener('keydown', function (event) {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1, false);
      }
    });
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer); scrollTimer = setTimeout(update, 100);
    }, {passive:true});
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', function () { if (motion.matches) setPlaying(false); });
    window.addEventListener('resize', function () { update(); schedule(); });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; schedule(); }, {threshold:.25}).observe(track);
    } else visible = true;
    setPlaying(false); update();
  });

  var finder = document.getElementById('programme-finder');
  if (finder) {
    var focus = document.getElementById('finder-focus');
    var audience = document.getElementById('finder-audience');
    var format = document.getElementById('finder-format');
    var result = document.getElementById('finder-result');
    var recommendations = {
      combined:['A combined session','Begin with a conversation about your group, then bring together movement, breath awareness and guided rest around a clear focus.'],
      movement:['Yoga and movement','Explore a session centred on joint movement, mobility and Hatha yoga. Discuss the group’s experience, clothing and available space with Ankur.'],
      breath:['Breath and attention','Explore guided breath awareness, progressively taught pranayama and meditation, with the pace chosen for the group.'],
      rest:['Guided rest with Yoga Nidra','Explore a guided rest and awareness session. Discuss the time, quiet space and support people will need to rest comfortably.']
    };
    function describe() {
      var choice = recommendations[focus.value];
      result.querySelector('h3').textContent = choice[0];
      result.querySelector('p').textContent = choice[1];
    }
    finder.addEventListener('submit', function (event) { event.preventDefault(); });
    focus.addEventListener('change', describe);
    document.getElementById('finder-discuss').addEventListener('click', function () {
      var audienceMap = {team:'Whole team / mixed roles', leaders:'People managers / team leaders', mixed:'Other / mixed audience'};
      var formatMap = {unsure:'Please advise', single:'Single session', workshop:'Workshop / wellbeing day', series:'Recurring programme'};
      var checkboxMap = {movement:'focus-0', breath:'focus-1', rest:'focus-3'};
      function selectChoice(id, value) {
        var select = document.getElementById(id);
        select.value = value;
        Array.from(select.options).forEach(function (option) {
          option.selected = option.value === value;
          if (option.selected) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        });
        select.dispatchEvent(new Event('change', {bubbles:true}));
      }
      selectChoice('corporate-audience', audienceMap[audience.value]);
      selectChoice('corporate-format', formatMap[format.value]);
      if (checkboxMap[focus.value]) {
        var chosenFocus = document.getElementById(checkboxMap[focus.value]);
        chosenFocus.checked = true;
        chosenFocus.setAttribute('checked', '');
        chosenFocus.dispatchEvent(new Event('change', {bubbles:true}));
      }
      var brief = 'Programme starting point: ' + recommendations[focus.value][0] + '. Audience: ' + audience.options[audience.selectedIndex].text + '. Format: ' + format.options[format.selectedIndex].text + '.';
      var goals = document.getElementById('corporate-goals');
      // Preserve anything the visitor has already written.
      if (goals.dataset.finderBrief) goals.value = goals.value.replace(goals.dataset.finderBrief, '').trim();
      goals.value = (goals.value.trim() ? goals.value.trim() + '\n\n' : '') + brief;
      goals.defaultValue = goals.value;
      goals.dataset.finderBrief = brief;
      goals.dispatchEvent(new Event('input', {bubbles:true}));
      var carried = document.getElementById('programme-carried');
      carried.textContent = brief + ' You can edit this in the form below.';
      carried.hidden = false;
      document.getElementById('corporate-enquiry').scrollIntoView({behavior:motion.matches ? 'instant' : 'smooth', block:'start'});
      document.getElementById('corporate-name').focus({preventScroll:true});
    });
    describe();
  }

  var player = document.querySelector('[data-breathing-player]');
  if (player) {
    var start = document.getElementById('breath-start');
    var sound = document.getElementById('breath-sound');
    var pace = document.getElementById('breath-pace');
    var phaseLabel = player.querySelector('.breath-phase');
    var tickLabel = player.querySelector('.breath-tick');
    var remaining = player.querySelector('.breath-remaining');
    var status = player.querySelector('.breath-status');
    var orb = player.querySelector('.breath-orb');
    var running = false, soundOn = false, frame = 0, started = 0, lastPhase = -1;
    var audio = null, voices = [];
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    function silence() {
      voices.forEach(function (voice) { try { voice.stop(); } catch (_) {} }); voices = [];
    }
    function chime(inhale) {
      if (!audio || !soundOn || audio.state !== 'running') return;
      var tone = audio.createOscillator(), gain = audio.createGain();
      tone.type = 'sine'; tone.frequency.value = inhale ? 440 : 330;
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(.035, audio.currentTime + .05);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + 1.1);
      tone.connect(gain); gain.connect(audio.destination);
      voices.push(tone);
      tone.onended = function () { tone.disconnect(); gain.disconnect(); voices = voices.filter(function (v) { return v !== tone; }); };
      tone.start(); tone.stop(audio.currentTime + 1.15);
    }
    function stop(message, completed) {
      running = false; cancelAnimationFrame(frame); silence();
      start.textContent = completed ? 'Start again' : 'Start one minute'; pace.disabled = false;
      phaseLabel.textContent = completed ? 'Return to your own rhythm' : 'Breathe naturally';
      tickLabel.textContent = completed ? 'Take your time' : 'Ready when you are';
      remaining.textContent = completed ? '0:00' : '1:00';
      orb.style.transform = 'scale(.68)';
      status.textContent = message;
    }
    function animate(now) {
      if (!running) return;
      var elapsed = Math.max(0, now - started);
      if (elapsed >= 60000) { stop('Minute complete. Notice how you feel, without looking for a particular result.', true); return; }
      var seconds = Number(pace.value), phaseDuration = seconds * 1000;
      var phase = Math.floor(elapsed / phaseDuration), inhale = phase % 2 === 0;
      var progress = (elapsed % phaseDuration) / phaseDuration;
      if (phase !== lastPhase) {
        lastPhase = phase;
        phaseLabel.textContent = inhale ? 'Inhale gently' : 'Exhale gently';
        status.textContent = (inhale ? 'Inhale' : 'Exhale') + ' gently for ' + seconds + ' seconds, only if comfortable.';
        chime(inhale);
      }
      tickLabel.textContent = String(Math.min(seconds, Math.floor(progress * seconds) + 1)) + ' / ' + seconds;
      var left = Math.ceil((60000 - elapsed) / 1000);
      remaining.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      var eased = (1 - Math.cos(progress * Math.PI)) / 2;
      orb.style.transform = 'scale(' + (.68 + .32 * (inhale ? eased : 1 - eased)).toFixed(4) + ')';
      frame = requestAnimationFrame(animate);
    }
    start.addEventListener('click', function () {
      if (running) { stop('Stopped. Continue with your natural breathing.', false); return; }
      if (audio && soundOn) audio.resume().catch(function () {});
      running = true; lastPhase = -1; started = performance.now(); pace.disabled = true;
      start.textContent = 'Stop'; frame = requestAnimationFrame(animate);
    });
    if (!AudioContext) { sound.disabled = true; sound.textContent = 'Sound unavailable'; }
    sound.addEventListener('click', function () {
      soundOn = !soundOn;
      if (soundOn) {
        try {
          if (!audio) audio = new AudioContext();
          audio.resume().catch(function () { soundOn = false; sound.textContent = 'Sound unavailable'; sound.setAttribute('aria-pressed','false'); });
        } catch (_) { soundOn = false; sound.disabled = true; sound.textContent = 'Sound unavailable'; return; }
      } else silence();
      sound.setAttribute('aria-pressed', String(soundOn)); sound.textContent = soundOn ? 'Sound on' : 'Sound off';
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && running) stop('Paused when you left the page. Start again whenever you like.', false); });
    window.addEventListener('pagehide', function () { stop('Ready when you are.', false); if (audio) audio.suspend().catch(function () {}); });
  }
}());
