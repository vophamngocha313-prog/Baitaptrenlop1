/* Bật/tắt toàn bộ trải nghiệm Ngày Nhà giáo Việt Nam tại đây. */
const TEACHERS_DAY_THEME = true;

/* Các thông số dễ chỉnh: mật độ, kích thước, thời gian, âm thanh và lời chúc. */
const CONFIG = {
  debug: true,
  fall: {
    countDesktop: 11,
    countMobile: 6,
    countReducedMotion: 5,
    countDesktopMax: 12,
    countMobileMax: 7,
    boostDuration: 6000,
    durationMin: 10,
    durationMax: 15,
    reducedMotionMultiplier: 1.5,
    sizeMin: 40,
    sizeMax: 64,
    colors: ["#F6E7B4", "#EBD58A", "#CFE0F1", "#A9C8E6"]
  },
  confetti: {
    count: 28,
    reducedMotionCount: 8,
    minDuration: 900,
    maxDuration: 1600,
    colors: ["#F6E7B4", "#EBD58A", "#CFE0F1", "#A9C8E6"]
  },
  greeting: {
    delay: 500,
    characterDelay: 14,
    title: "Tri ân thầy cô",
    message: "Kính chúc quý thầy cô luôn dồi dào sức khỏe, hạnh phúc và thành công. Chúc quý thầy cô mãi giữ ngọn lửa nhiệt huyết để tiếp tục thắp sáng những ước mơ."
  },
  music: {
    volume: 0.35,
    duckFactor: 0.4,
    bpmMin: 68,
    bpmMax: 82,
    schedulerInterval: 80,
    lookAheadSeconds: 0.18,
  },
  sound: {
    popVolume: 0.12,
    sparkleVolume: 0.035
  }
};

(() => {
  /* Điều hướng thu gọn và menu trên thiết bị di động. */
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".nav-links");
  const mobileQuery = window.matchMedia("(max-width: 700px)");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function closeMenu() {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Mở menu");
    navigation.classList.remove("is-open");
  }

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Mở menu" : "Đóng menu");
      navigation.classList.toggle("is-open", !isOpen);
    });
    navigation.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", closeMenu));
    mobileQuery.addEventListener("change", closeMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  /* Hiện nội dung theo cuộn; không ẩn nội dung khi giảm chuyển động. */
  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    revealItems.forEach((item, index) => {
      const sectionItems = item.closest("section")?.querySelectorAll(".reveal");
      const localIndex = sectionItems ? [...sectionItems].indexOf(item) : index;
      item.style.setProperty("--reveal-delay", `${(localIndex % 4) * 90}ms`);
      if (!item.classList.contains("reveal-left") &&
          !item.classList.contains("reveal-right") &&
          !item.classList.contains("reveal-up") &&
          !item.classList.contains("reveal-scale")) {
        item.classList.add(["reveal-up", "reveal-left", "reveal-right"][localIndex % 3]);
      }
    });
  }
  if ("IntersectionObserver" in window && !reduceMotionQuery.matches && revealItems.length) {
    document.documentElement.classList.add("js-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* Trên điện thoại chỉ mở một mục kinh nghiệm cùng lúc. */
  const jobCards = document.querySelectorAll(".experience-card");
  jobCards.forEach((card) => {
    card.addEventListener("toggle", () => {
      if (!mobileQuery.matches || !card.open) return;
      jobCards.forEach((otherCard) => {
        if (otherCard !== card) otherCard.open = false;
      });
    });
  });

  const currentYear = document.getElementById("current-year");
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());

  /* Nhạc nền ngẫu hứng bằng Web Audio, không dùng bản thu hoặc liên kết ngoài. */
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const musicToggle = document.getElementById("music-toggle");
  const musicStatus = document.getElementById("music-status");
  let audioContext = null;
  let musicBus = null;
  let musicActive = false;
  let schedulerId = null;
  let nextNoteTime = 0;
  let melodyStep = 0;
  let eighthNote = 0;
  let modalWasOpen = false;

  function getAudioContext() {
    if (!AudioContextClass) return null;
    if (!audioContext) {
      audioContext = new AudioContextClass();
      musicBus = audioContext.createGain();
      musicBus.gain.value = 0.0001;
      musicBus.connect(audioContext.destination);
    }
    return audioContext;
  }

  function setMusicLevel(level, seconds = 0.8) {
    if (!audioContext || !musicBus) return;
    const now = audioContext.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
    musicBus.gain.linearRampToValueAtTime(Math.max(level, 0.0001), now + seconds);
  }

  function updateMusicControl(isPlaying) {
    if (!musicToggle) return;
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Tắt nhạc nền 20/11" : "Bật nhạc nền 20/11");
    musicToggle.title = isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền";
  }

  function scheduleMusicNote(frequency, start, duration, volume, waveform = "sine") {
    if (!audioContext || !musicBus) return;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(musicBus);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function scheduleMusicStep() {
    if (!audioContext || !musicActive) return;
    const notes = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
    const chordRoots = [130.81, 146.83, 164.81, 196];
    while (nextNoteTime < audioContext.currentTime + CONFIG.music.lookAheadSeconds) {
      if (melodyStep % 4 === 0) {
        const root = chordRoots[Math.floor(melodyStep / 4) % chordRoots.length];
        scheduleMusicNote(root, nextNoteTime, 1.15, 0.035, "sine");
        scheduleMusicNote(root * 2, nextNoteTime, 0.9, 0.012, "triangle");
      }
      if (Math.random() > 0.16) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        scheduleMusicNote(note, nextNoteTime, 0.42 + Math.random() * 0.35, 0.045, "sine");
        if (Math.random() > 0.68) {
          scheduleMusicNote(note * 2, nextNoteTime + eighthNote / 2, 0.3, 0.018, "triangle");
        }
      }
      melodyStep += 1;
      nextNoteTime += eighthNote;
    }
  }

  async function startMusic() {
    if (musicActive || !TEACHERS_DAY_THEME) return;
    const context = getAudioContext();
    if (!context || !musicBus) {
      if (musicStatus) musicStatus.textContent = "Trình duyệt này không hỗ trợ nhạc nền.";
      return;
    }
    try {
      await context.resume();
      const bpm = CONFIG.music.bpmMin +
        Math.random() * (CONFIG.music.bpmMax - CONFIG.music.bpmMin);
      eighthNote = 60 / bpm / 2;
      nextNoteTime = context.currentTime + 0.08;
      melodyStep = Math.floor(Math.random() * 8);
      musicActive = true;
      updateMusicControl(true);
      setMusicLevel(CONFIG.music.volume * (modalWasOpen ? CONFIG.music.duckFactor : 1));
      scheduleMusicStep();
      schedulerId = window.setInterval(scheduleMusicStep, CONFIG.music.schedulerInterval);
      if (musicStatus) musicStatus.textContent = "Đang phát nhạc nền ngẫu hứng chủ đề tri ân 20/11.";
    } catch (error) {
      if (musicStatus) musicStatus.textContent = `Không thể bật nhạc nền: ${error.message}`;
    }
  }

  function stopMusic() {
    if (!musicActive) return;
    musicActive = false;
    updateMusicControl(false);
    setMusicLevel(0, 0.45);
    window.clearInterval(schedulerId);
    schedulerId = null;
    if (musicStatus) musicStatus.textContent = "Nhạc nền đang tắt.";
  }

  musicToggle?.addEventListener("click", () => {
    if (musicActive) stopMusic();
    else void startMusic();
  });

  /* Pop ngắn và arpeggio 5 nốt cho hiệu ứng nổ. */
  function playCelebrationSound() {
    const context = getAudioContext();
    if (!context) return;
    void context.resume().catch(() => {
      if (musicStatus) musicStatus.textContent = "Không thể phát âm thanh hiệu ứng trong trình duyệt này.";
    });
    const now = context.currentTime;
    const pop = context.createOscillator();
    const popGain = context.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(240, now);
    pop.frequency.exponentialRampToValueAtTime(74, now + 0.15);
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.exponentialRampToValueAtTime(CONFIG.sound.popVolume, now + 0.012);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    pop.connect(popGain);
    popGain.connect(context.destination);
    pop.start(now);
    pop.stop(now + 0.2);

    [659.25, 783.99, 987.77, 1174.66, 1318.51].forEach((frequency, index) => {
      const start = now + 0.07 + index * 0.075;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(CONFIG.sound.sparkleVolume, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.21);
      oscillator.connect(envelope);
      envelope.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    });
  }

  /* Vật rơi SVG phẳng, là nút bấm thực sự và có hit area tối thiểu 72px. */
  const fallingLayer = document.getElementById("falling-decorations");
  const effectLayer = document.getElementById("celebration-effects");
  const fallingHint = document.getElementById("falling-hint");
  const wishOverlay = document.getElementById("wish-overlay");
  const wishTitle = document.getElementById("wish-title");
  const wishMessage = document.getElementById("wish-message");
  const wishClose = document.getElementById("wish-close");
  const svgArt = {
    petal: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 7C47 22 47 42 32 57 17 42 17 22 32 7Z"/></svg>',
    star: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M32 4c5.5 14.5 13.5 22.5 28 28-14.5 5.5-22.5 13.5-28 28C26.5 45.5 18.5 37.5 4 32 18.5 26.5 26.5 18.5 32 4Z"/></svg>',
    circle: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="25" fill="currentColor"/></svg>',
    leaf: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M55 8C31 8 12 15 9 33c-2 13 9 23 21 20C48 50 55 30 55 8Z"/></svg>'
  };
  const symbolTypes = Object.keys(svgArt);
  const decorationAnimations = new WeakMap();
  const interactionPaused = new WeakSet();
  let densityBoostUntil = 0;
  let densityTimer = 0;
  let hintTimer = 0;
  let previousFocus = null;
  let typewriterTimer = 0;
  let modalTimer = 0;

  function getDecorationCount(boosted = Date.now() < densityBoostUntil) {
    const mobile = mobileQuery.matches;
    if (reduceMotionQuery.matches) {
      return CONFIG.fall.countReducedMotion;
    }
    const normal = mobile ? CONFIG.fall.countMobile : CONFIG.fall.countDesktop;
    const max = mobile ? CONFIG.fall.countMobileMax : CONFIG.fall.countDesktopMax;
    return Math.min(max, boosted ? max : normal);
  }

  function setDecorationPauseState() {
    if (!fallingLayer) return;
    fallingLayer.querySelectorAll(".falling-decoration").forEach((item) => {
      const animation = decorationAnimations.get(item);
      if (!animation) return;
      if (document.visibilityState === "hidden" || interactionPaused.has(item)) {
        animation.pause();
      } else {
        animation.play();
      }
    });
  }

  function startDecorationAnimation(item) {
    const reducedMotion = reduceMotionQuery.matches;
    const baseDuration = CONFIG.fall.durationMin +
      Math.random() * (CONFIG.fall.durationMax - CONFIG.fall.durationMin);
    const duration = baseDuration * (reducedMotion ? CONFIG.fall.reducedMotionMultiplier : 1);
    const delay = -Math.random() * duration * 1000;
    const drift = reducedMotion ? 0 : Math.round(Math.random() * 54 - 27);
    const rotation = reducedMotion ? 0 : Math.round(Math.random() * 32 - 16);
    const keyframes = [
      { transform: `translate3d(0, -15vh, 0) rotate(0deg)` },
      { transform: `translate3d(${drift * 0.75}px, 22vh, 0) rotate(${rotation * 0.25}deg)` },
      { transform: `translate3d(${drift * -0.5}px, 57vh, 0) rotate(${rotation * 0.6}deg)` },
      { transform: `translate3d(${drift * 0.35}px, 86vh, 0) rotate(${rotation * 0.85}deg)` },
      { transform: `translate3d(0, 115vh, 0) rotate(${rotation}deg)` }
    ];
    const animation = item.animate(keyframes, {
      duration: duration * 1000,
      delay,
      iterations: Infinity,
      easing: "linear"
    });
    decorationAnimations.set(item, animation);
    item.style.setProperty("--duration", `${duration}s`);
    item.style.setProperty("--delay", `${delay / 1000}s`);
    item.style.setProperty("--drift", `${drift}px`);
    item.style.setProperty("--size", item.style.getPropertyValue("--fall-size"));
    if (document.visibilityState === "hidden") animation.pause();
  }

  function syncFallingDecorations() {
    if (!TEACHERS_DAY_THEME || !fallingLayer) return;
    const targetCount = getDecorationCount();
    const items = [...fallingLayer.querySelectorAll(".falling-decoration")];
    while (items.length < targetCount) {
      const item = createFallingDecoration();
      fallingLayer.appendChild(item);
      startDecorationAnimation(item);
      items.push(item);
    }
    while (items.length > targetCount) {
      const item = items.pop();
      if (item) {
        decorationAnimations.get(item)?.cancel();
        item.remove();
      }
    }
    const currentItems = [...fallingLayer.querySelectorAll(".falling-decoration")];
    currentItems.forEach((item, index) => {
      item.style.setProperty("--fall-index", String(index));
      const columnWidth = window.innerWidth / Math.max(currentItems.length, 1);
      const maxJitter = Math.min(30, Math.max(0, (columnWidth - 72) / 2));
      const jitter = (Math.random() - 0.5) * maxJitter * 2;
      const left = Math.max(0, Math.min(
        window.innerWidth - 72,
        columnWidth * (index + 0.5) - 36 + jitter
      ));
      item.style.left = `${left}px`;
    });
    setDecorationPauseState();
    if (CONFIG.debug) {
      console.info(`[20/11] Vật rơi: ${targetCount}; reduced-motion: ${reduceMotionQuery.matches ? "bật" : "tắt"}`);
    }
  }

  function restartDecorationAnimations() {
    if (!fallingLayer) return;
    fallingLayer.querySelectorAll(".falling-decoration").forEach((item) => {
      decorationAnimations.get(item)?.cancel();
      startDecorationAnimation(item);
    });
    setDecorationPauseState();
  }

  let activeDecorationTooltip = null;
  let activeTooltipOwner = null;
  let decorationTooltipSequence = 0;

  function showDecorationTooltip(item) {
    if (activeTooltipOwner && activeTooltipOwner !== item) {
      activeTooltipOwner.removeAttribute("aria-describedby");
    }
    activeDecorationTooltip?.remove();
    const tooltip = document.createElement("span");
    tooltip.className = "falling-tooltip";
    tooltip.id = `falling-tooltip-${++decorationTooltipSequence}`;
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = "Nhận lời chúc 20/11";
    document.body.appendChild(tooltip);
    const rect = item.getBoundingClientRect();
    const left = Math.max(8, Math.min(
      window.innerWidth - tooltip.offsetWidth - 8,
      rect.left + rect.width / 2 - tooltip.offsetWidth / 2
    ));
    const top = rect.bottom + tooltip.offsetHeight + 8 <= window.innerHeight
      ? rect.bottom + 6
      : Math.max(8, rect.top - tooltip.offsetHeight - 6);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    item.setAttribute("aria-describedby", tooltip.id);
    activeDecorationTooltip = tooltip;
    activeTooltipOwner = item;
  }

  function hideDecorationTooltip(item) {
    if (activeTooltipOwner !== item) {
      item.removeAttribute("aria-describedby");
      return;
    }
    activeDecorationTooltip?.remove();
    activeDecorationTooltip = null;
    activeTooltipOwner = null;
    item.removeAttribute("aria-describedby");
  }

  function createFallingDecoration() {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "falling-decoration";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", "Mở lời chúc Ngày Nhà giáo Việt Nam 20/11");
    item.innerHTML = svgArt[symbolTypes[Math.floor(Math.random() * symbolTypes.length)]];
    item.style.setProperty("--fall-color", CONFIG.fall.colors[Math.floor(Math.random() * CONFIG.fall.colors.length)]);
    item.style.setProperty("--fall-opacity", `${0.75 + Math.random() * 0.15}`);
    const visualSize = CONFIG.fall.sizeMin + Math.random() * (CONFIG.fall.sizeMax - CONFIG.fall.sizeMin);
    item.style.setProperty("--fall-size", `${visualSize}px`);
    item.style.setProperty("--size", `${visualSize}px`);
    item.style.top = "0";
    item.style.left = "0px";
    item.style.setProperty("--duration", `${CONFIG.fall.durationMin}s`);
    item.style.setProperty("--delay", "0s");
    item.style.setProperty("--drift", "0px");
    item.addEventListener("click", () => triggerDecoration(item));
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      triggerDecoration(item);
    });
    item.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      interactionPaused.add(item);
      setDecorationPauseState();
      showDecorationTooltip(item);
    });
    item.addEventListener("pointerleave", () => {
      interactionPaused.delete(item);
      setDecorationPauseState();
      hideDecorationTooltip(item);
    });
    item.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch") {
        interactionPaused.delete(item);
        setDecorationPauseState();
      }
    });
    item.addEventListener("pointercancel", () => {
      interactionPaused.delete(item);
      setDecorationPauseState();
    });
    item.addEventListener("focus", () => {
      interactionPaused.add(item);
      setDecorationPauseState();
      showDecorationTooltip(item);
    });
    item.addEventListener("blur", () => {
      interactionPaused.delete(item);
      setDecorationPauseState();
      hideDecorationTooltip(item);
    });
    return item;
  }

  function boostFallingDensity() {
    densityBoostUntil = Date.now() + CONFIG.fall.boostDuration;
    syncFallingDecorations();
    window.clearTimeout(densityTimer);
    densityTimer = window.setTimeout(() => {
      densityBoostUntil = 0;
      syncFallingDecorations();
    }, CONFIG.fall.boostDuration);
  }

  /* Tạo burst tại đúng tâm của vật được bấm, kèm vòng sóng. */
  function createBurst(x, y) {
    if (!effectLayer) return;
    const flash = document.createElement("span");
    flash.className = "celebration-flash";
    effectLayer.appendChild(flash);
    window.setTimeout(() => flash.remove(), 500);
    const ripple = document.createElement("span");
    ripple.className = "celebration-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    effectLayer.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 900);

    const count = reduceMotionQuery.matches ? CONFIG.confetti.reducedMotionCount : CONFIG.confetti.count;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = 55 + Math.random() * 155;
      const duration = CONFIG.confetti.minDuration + Math.random() * (CONFIG.confetti.maxDuration - CONFIG.confetti.minDuration);
      particle.className = "confetti-particle";
      const particleSize = 4 + Math.random() * 3;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${particleSize}px`;
      particle.style.height = `${particleSize}px`;
      particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance + 70}px`);
      particle.style.setProperty("--particle-duration", `${duration}ms`);
      particle.style.setProperty("--particle-color", CONFIG.confetti.colors[Math.floor(Math.random() * CONFIG.confetti.colors.length)]);
      particle.style.setProperty("--particle-rotation", `${Math.round(Math.random() * 500 - 250)}deg`);
      fragment.appendChild(particle);
    }
    effectLayer.appendChild(fragment);
    window.setTimeout(() => {
      effectLayer.querySelectorAll(".confetti-particle").forEach((particle) => particle.remove());
    }, CONFIG.confetti.maxDuration + 100);
  }

  function startTypewriter() {
    if (!wishMessage) return;
    window.clearInterval(typewriterTimer);
    wishMessage.textContent = "";
    let index = 0;
    typewriterTimer = window.setInterval(() => {
      index += 1;
      wishMessage.textContent = CONFIG.greeting.message.slice(0, index);
      if (index >= CONFIG.greeting.message.length) {
        window.clearInterval(typewriterTimer);
      }
    }, CONFIG.greeting.characterDelay);
  }

  function openWishCard() {
    if (!wishOverlay || !wishTitle) return;
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.isConnected &&
      activeElement !== document.body &&
      activeElement !== document.documentElement
    ) {
      previousFocus = activeElement;
    } else if (!previousFocus?.isConnected) {
      previousFocus = fallingLayer?.querySelector(".falling-decoration") || null;
    }
    wishTitle.textContent = CONFIG.greeting.title;
    wishOverlay.hidden = false;
    modalWasOpen = true;
    setMusicLevel(CONFIG.music.volume * CONFIG.music.duckFactor);
    startTypewriter();
    wishClose?.focus();
  }

  function closeWishCard() {
    if (!wishOverlay || wishOverlay.hidden) return;
    wishOverlay.hidden = true;
    modalWasOpen = false;
    window.clearInterval(typewriterTimer);
    setMusicLevel(CONFIG.music.volume);
    const focusTarget = previousFocus?.isConnected
      ? previousFocus
      : fallingLayer?.querySelector(".falling-decoration");
    focusTarget?.focus();
  }

  function triggerDecoration(item) {
    if (!item.isConnected || item.disabled) return;
    hideDecorationTooltip(item);
    interactionPaused.delete(item);
    previousFocus = [...(fallingLayer?.querySelectorAll(".falling-decoration") || [])]
      .find((decoration) => decoration !== item && !decoration.disabled) || item;
    item.disabled = true;
    if (fallingHint) fallingHint.hidden = true;
    window.clearTimeout(hintTimer);
    const rect = item.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    item.style.position = "fixed";
    item.style.top = `${rect.top}px`;
    item.style.left = `${rect.left}px`;
    decorationAnimations.get(item)?.cancel();
    decorationAnimations.delete(item);
    interactionPaused.delete(item);
    item.style.transform = "none";
    void item.offsetWidth;
    item.classList.add("is-bursting");
    createBurst(x, y);
    playCelebrationSound();
    boostFallingDensity();
    window.setTimeout(() => {
      item.remove();
      syncFallingDecorations();
    }, 190);
    window.clearTimeout(modalTimer);
    modalTimer = window.setTimeout(openWishCard, CONFIG.greeting.delay);
  }

  if (TEACHERS_DAY_THEME && fallingLayer) {
    syncFallingDecorations();
    if (fallingHint) {
      hintTimer = window.setTimeout(() => {
        fallingHint.hidden = true;
      }, 6000);
    }
    mobileQuery.addEventListener("change", syncFallingDecorations);
    reduceMotionQuery.addEventListener("change", () => {
      syncFallingDecorations();
      restartDecorationAnimations();
    });
    window.addEventListener("resize", () => {
      syncFallingDecorations();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        fallingLayer.querySelectorAll(".falling-decoration").forEach((item) => interactionPaused.delete(item));
      }
      setDecorationPauseState();
    });
    window.addEventListener("blur", () => {
      fallingLayer.querySelectorAll(".falling-decoration").forEach((item) => interactionPaused.delete(item));
      setDecorationPauseState();
    });
  } else {
    fallingLayer?.setAttribute("hidden", "");
    effectLayer?.setAttribute("hidden", "");
    fallingHint?.setAttribute("hidden", "");
    musicToggle?.setAttribute("hidden", "");
  }

  wishClose?.addEventListener("click", closeWishCard);
  wishOverlay?.addEventListener("click", (event) => {
    if (event.target === wishOverlay) closeWishCard();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWishCard();
    if (event.key === "Tab" && wishOverlay && !wishOverlay.hidden) {
      const focusable = [...wishOverlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);
      const first = focusable[0] || wishClose;
      const last = focusable[focusable.length - 1] || wishClose;
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!wishOverlay.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
  });

  /* Biểu mẫu mở ứng dụng email; dữ liệu không được gửi lên máy chủ. */
  const contactForm = document.getElementById("contact-form");
  const formNote = document.getElementById("form-note");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(contactForm instanceof HTMLFormElement)) return;
    const data = new FormData(contactForm);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent(`Lời nhắn từ ${name}`);
    const body = encodeURIComponent(`Tên: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:vpnh313@gmail.com?subject=${subject}&body=${body}`;
    if (formNote) formNote.textContent = "Đang mở ứng dụng email của bạn…";
  });
})();
