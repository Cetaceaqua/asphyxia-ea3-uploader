(function () {
  const FOIL_PATTERNS = {
    basic: {
      size: "110px 110px",
      svg: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'>
          <defs>
            <g id='dspark'>
              <path d='M0,-8 Q0,0 8,0 Q0,0 0,8 Q0,0 -8,0 Z' fill='#ffffff' opacity='0.95'/>
              <circle cx='0' cy='0' r='1.8' fill='#ffffff'/>
            </g>
            <g id='microstar'>
              <polygon points='0,-5 3,0 0,5 -3,0' fill='#ffffff' opacity='0.85'/>
            </g>
          </defs>
          <use href='#dspark' x='22' y='26' transform='scale(0.85)'/>
          <use href='#dspark' x='78' y='42' transform='scale(1.1)'/>
          <use href='#dspark' x='42' y='86' transform='scale(0.75)'/>
          <use href='#dspark' x='95' y='96' transform='scale(0.9)'/>
          <use href='#microstar' x='52' y='18'/>
          <use href='#microstar' x='18' y='72'/>
          <use href='#microstar' x='84' y='76'/>
          <circle cx='10' cy='45' r='1.5' fill='#ffffff' opacity='0.8'/>
          <circle cx='64' cy='62' r='2' fill='#ffffff' opacity='0.9'/>
          <circle cx='35' cy='52' r='1.2' fill='#ffffff' opacity='0.7'/>
          <circle cx='98' cy='22' r='1.4' fill='#ffffff' opacity='0.75'/>
        </svg>
      `)}")`,
    },

    starlight: {
      size: "150px 150px",
      svg: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'>
          <defs>
            <g id='burst'>
              <path d='M0,-28 L2,-6 L24,0 L2,6 L0,28 L-2,6 L-24,0 L-2,-6 Z' fill='#ffffff' opacity='0.96'/>
              <path d='M-14,-14 L0,-3 L14,-14 L3,0 L14,14 L0,3 L-14,14 L-3,0 Z' fill='#ffffff' opacity='0.88'/>
              <circle cx='0' cy='0' r='7' fill='none' stroke='#ffffff' stroke-width='1.2' opacity='0.85'/>
              <circle cx='0' cy='0' r='3' fill='#ffffff'/>
            </g>
            <g id='smallburst'>
              <path d='M0,-14 L1,-3 L12,0 L1,3 L0,14 L-1,3 L-12,0 L-1,-3 Z' fill='#ffffff' opacity='0.9'/>
              <circle cx='0' cy='0' r='1.8' fill='#ffffff'/>
            </g>
          </defs>
          <use href='#burst' x='42' y='42'/>
          <use href='#smallburst' x='115' y='105' transform='scale(0.85)'/>
          <circle cx='110' cy='32' r='2.2' fill='#ffffff' opacity='0.85'/>
          <circle cx='28' cy='115' r='2' fill='#ffffff' opacity='0.85'/>
          <circle cx='80' cy='95' r='1.5' fill='#ffffff' opacity='0.75'/>
        </svg>
      `)}")`,
    },

    prismatic: {
      size: "64px 64px",
      svg: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
          <line x1='-10' y1='22' x2='22' y2='-10' stroke='#ffffff' stroke-width='3.2' opacity='0.92'/>
          <line x1='0' y1='48' x2='48' y2='0' stroke='#ffffff' stroke-width='2.2' opacity='0.82'/>
          <line x1='16' y1='80' x2='80' y2='16' stroke='#ffffff' stroke-width='3.5' opacity='0.95'/>
          <line x1='36' y1='100' x2='100' y2='36' stroke='#ffffff' stroke-width='1.8' opacity='0.78'/>
          <line x1='-5' y1='35' x2='35' y2='-5' stroke='#ffffff' stroke-width='0.9' opacity='0.6'/>
          <line x1='10' y1='62' x2='62' y2='10' stroke='#ffffff' stroke-width='0.9' opacity='0.6'/>
          <polygon points='32,16 48,32 32,48 16,32' fill='none' stroke='#ffffff' stroke-width='1.4' opacity='0.75'/>
          <circle cx='32' cy='32' r='2' fill='#ffffff' opacity='0.95'/>
          <circle cx='0' cy='0' r='1.5' fill='#ffffff' opacity='0.8'/>
          <circle cx='64' cy='64' r='1.5' fill='#ffffff' opacity='0.8'/>
        </svg>
      `)}")`,
    },

    dots: {
      size: "40px 40px",
      svg: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
          <rect x='4' y='4' width='7' height='7' rx='1' fill='#ffffff' opacity='0.96'/>
          <rect x='24' y='24' width='7' height='7' rx='1' fill='#ffffff' opacity='0.96'/>
          <rect x='25' y='5' width='5' height='5' rx='0.8' fill='#ffffff' opacity='0.88'/>
          <rect x='5' y='25' width='5' height='5' rx='0.8' fill='#ffffff' opacity='0.88'/>
          <circle cx='20' cy='20' r='1.8' fill='#ffffff' opacity='0.92'/>
          <circle cx='0' cy='20' r='1.4' fill='#ffffff' opacity='0.8'/>
          <circle cx='40' cy='20' r='1.4' fill='#ffffff' opacity='0.8'/>
          <circle cx='20' cy='0' r='1.4' fill='#ffffff' opacity='0.8'/>
          <circle cx='20' cy='40' r='1.4' fill='#ffffff' opacity='0.8'/>
        </svg>
      `)}")`,
    },
  };

  class HoloCardStage {
    constructor() {
      this.cardData = null;
      this.isFlipped = false;
      this.isHoloEnabled = true;
      this.currentPatternKey = "basic";
      this.isAutoTilting = false;
      this.autoTiltAnimId = null;
      this.autoTiltStartTime = 0;

      this.initElements();
      this.bindEvents();
    }

    initElements() {
      this.modal = document.getElementById("lightboxModal");
      this.viewport = document.querySelector(".holo-stage-viewport");
      this.wrapper = document.getElementById("holoCardWrapper");
      this.rotator = document.getElementById("holoCardRotator");
      this.faceFront = document.getElementById("holoFaceFront");
      this.faceBack = document.getElementById("holoFaceBack");
      this.imgFront = document.getElementById("holoImgFront");
      this.imgBack = document.getElementById("holoImgBack");
      this.foilContainer = document.getElementById("holoFoilContainer");
      this.foilRainbow = document.getElementById("holoFoilRainbow");
      this.foilBase = document.getElementById("holoFoilBase");
      this.foilPattern = document.getElementById("holoFoilPattern");

      this.btnFlip = document.getElementById("btnHoloFlip");
      this.btnToggleHolo = document.getElementById("btnHoloToggle");
      this.btnAutoTilt = document.getElementById("btnHoloAutoTilt");
      this.patternSelect = document.getElementById("holoPatternSelect");

      this.dlFront = document.getElementById("dlCardFront");
      this.dlBack = document.getElementById("dlCardBack");
      this.dlHolo = document.getElementById("dlCardHolo");
      this.dlIr = document.getElementById("dlCardIr");

      this.infoTitle = document.getElementById("holoCardTitle");
      this.infoDesc = document.getElementById("holoCardDesc");
      this.infoTags = document.getElementById("holoCardTags");
    }

    bindEvents() {
      if (!this.viewport || !this.rotator) return;

      const onMove = (e) => {
        if (this.isAutoTilting) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.updateTilt(clientX, clientY);
      };

      const onLeave = () => {
        if (this.isAutoTilting) return;
        this.resetTilt();
      };

      this.viewport.addEventListener("mousemove", onMove);
      this.viewport.addEventListener("mouseleave", onLeave);
      this.viewport.addEventListener("touchmove", onMove, { passive: true });
      this.viewport.addEventListener("touchend", onLeave);
      this.viewport.addEventListener("touchcancel", onLeave);

      if (this.wrapper) {
        this.wrapper.addEventListener("dblclick", () => this.toggleFlip());
      }

      if (this.btnFlip) {
        this.btnFlip.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleFlip();
        });
      }

      if (this.btnToggleHolo) {
        this.btnToggleHolo.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleHolo();
        });
      }

      if (this.btnAutoTilt) {
        this.btnAutoTilt.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleAutoTilt();
        });
      }

      if (this.patternSelect) {
        this.patternSelect.addEventListener("change", (e) => {
          this.setFoilPattern(e.target.value);
        });
      }

      document.addEventListener("keydown", (e) => {
        if (!this.modal || !this.modal.classList.contains("is-active")) return;
        if (e.code === "Space") {
          e.preventDefault();
          this.toggleFlip();
        } else if (e.key === "h" || e.key === "H") {
          e.preventDefault();
          this.toggleHolo();
        }
      });
    }

    setCard(data) {
      this.cardData = data;
      this.resetFlip();
      this.isHoloEnabled = data.hasHolo !== false && !!data.holoUrl;
      this.stopAutoTilt();
      this.resetTilt();

      const orientation = data.orientation || "portrait";
      if (this.wrapper) {
        this.wrapper.classList.remove("is-portrait", "is-landscape");
        this.wrapper.classList.add(orientation === "landscape" ? "is-landscape" : "is-portrait");
      }

      const frontSrc = data.frontUrl || data.url;
      if (this.imgFront) {
        this.imgFront.src = frontSrc;
      }

      if (this.imgBack && this.faceBack) {
        if (data.backUrl) {
          this.imgBack.src = data.backUrl;
          this.faceBack.style.display = "";
          if (this.btnFlip) this.btnFlip.style.display = "";
        } else {
          this.imgBack.src = "";
          this.faceBack.style.display = "none";
          if (this.btnFlip) this.btnFlip.style.display = "none";
        }
      }

      if (this.foilContainer) {
        if (data.holoUrl) {
          const maskVal = `url("${data.holoUrl}")`;
          this.rotator.style.setProperty("--holo-mask-url", maskVal);
          this.foilContainer.classList.remove("is-hidden");
          if (this.btnToggleHolo) this.btnToggleHolo.style.display = "";
          if (this.patternSelect) this.patternSelect.closest(".control").style.display = "";
        } else {
          this.rotator.style.removeProperty("--holo-mask-url");
          this.foilContainer.classList.add("is-hidden");
          if (this.btnToggleHolo) this.btnToggleHolo.style.display = "none";
          if (this.patternSelect) this.patternSelect.closest(".control").style.display = "none";
        }
      }

      this.updateControlsState();
      this.setFoilPattern(this.currentPatternKey);

      if (this.dlFront) {
        this.dlFront.href = frontSrc;
        this.dlFront.setAttribute("download", data.filename || "card_front.png");
      }
      if (this.dlBack) {
        if (data.backUrl) {
          this.dlBack.href = data.backUrl;
          this.dlBack.setAttribute("download", `${data.cardId || "card"}_back.png`);
          this.dlBack.style.display = "";
        } else {
          this.dlBack.style.display = "none";
        }
      }
      if (this.dlHolo) {
        if (data.holoUrl) {
          this.dlHolo.href = data.holoUrl;
          this.dlHolo.setAttribute("download", `${data.cardId || "card"}_holo.png`);
          this.dlHolo.style.display = "";
        } else {
          this.dlHolo.style.display = "none";
        }
      }
      if (this.dlIr) {
        if (data.irUrl) {
          this.dlIr.href = data.irUrl;
          this.dlIr.setAttribute("download", `${data.cardId || "card"}_ir.png`);
          this.dlIr.style.display = "";
        } else {
          this.dlIr.style.display = "none";
        }
      }

      this.updateMetadataInfo(data);
    }

    updateMetadataInfo(data) {
      if (!this.infoTitle) return;

      const meta = data.cardMeta || {};
      let cardTitle = meta.description;
      if (cardTitle && meta.holoName) {
        cardTitle += ` [${meta.holoName}]`;
      }
      if (!cardTitle) {
        cardTitle = data.type || data.filename;
      }
      this.infoTitle.textContent = cardTitle;

      let descParts = [];
      if (data.type) descParts.push(data.type);
      if (meta.rarity) descParts.push(`★`.repeat(meta.rarity));
      if (meta.dateCode) descParts.push(`Date Code: ${meta.dateCode}`);
      if (data.refid) descParts.push(`Player: ${data.refid}`);
      if (data.time) descParts.push(`Uploaded: ${new Date(data.time).toLocaleString()}`);
      if (meta.copyright) descParts.push(meta.copyright);

      if (this.infoDesc) {
        this.infoDesc.textContent = descParts.join(" | ");
      }

      if (this.infoTags) {
        this.infoTags.innerHTML = "";

        const tagModel = document.createElement("span");
        tagModel.className = "tag is-primary is-light";
        tagModel.textContent = data.model || "TBS";
        this.infoTags.appendChild(tagModel);

        if (data.type) {
          const tagType = document.createElement("span");
          tagType.className = "tag is-info is-light";
          tagType.textContent = data.type;
          this.infoTags.appendChild(tagType);
        }

        if (data.hasHolo) {
          const tagHolo = document.createElement("span");
          tagHolo.className = "tag holo-tag";
          tagHolo.innerHTML = '<span class="icon is-small"><i class="mdi mdi-creation"></i></span><span>Holo</span>';
          this.infoTags.appendChild(tagHolo);
        }

        if (meta.rarity) {
          const tagRarity = document.createElement("span");
          tagRarity.className = "tag is-dark rarity-stars";
          tagRarity.textContent = "★".repeat(meta.rarity);
          this.infoTags.appendChild(tagRarity);
        }
      }
    }

    updateTilt(clientX, clientY) {
      if (!this.wrapper || !this.rotator) return;
      const rect = this.wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const halfW = rect.width / 2;
      const halfH = rect.height / 2;
      const normX = Math.max(-1.4, Math.min(1.4, dx / halfW));
      const normY = Math.max(-1.4, Math.min(1.4, dy / halfH));

      const maxTilt = 18;
      let rotateX = -normY * maxTilt;
      let rotateY = normX * maxTilt;

      if (this.isFlipped) {
        rotateY = -rotateY;
      }

      const pseudoX = Math.max(0, Math.min(100, 50 + normX * 45 * (this.isFlipped ? -1 : 1)));
      const pseudoY = Math.max(0, Math.min(100, 50 + normY * 45));

      const dist = Math.hypot(normX, normY);
      const pseudoOpacity = Math.min(1, Math.max(0.15, dist * 0.85));

      this.rotator.style.setProperty("--rot-x", `${rotateX.toFixed(2)}deg`);
      this.rotator.style.setProperty("--rot-y", `${rotateY.toFixed(2)}deg`);
      this.rotator.style.setProperty("--pseudo-x", `${pseudoX.toFixed(1)}%`);
      this.rotator.style.setProperty("--pseudo-y", `${pseudoY.toFixed(1)}%`);
      this.rotator.style.setProperty("--pseudo-opacity", pseudoOpacity.toFixed(2));
      this.rotator.style.setProperty("--rot-transition", "transform 0.08s ease-out");
    }

    resetTilt() {
      if (!this.rotator) return;
      this.rotator.style.setProperty("--rot-x", "0deg");
      this.rotator.style.setProperty("--rot-y", "0deg");
      this.rotator.style.setProperty("--pseudo-x", "50%");
      this.rotator.style.setProperty("--pseudo-y", "50%");
      this.rotator.style.setProperty("--pseudo-opacity", "0");
      this.rotator.style.setProperty("--rot-transition", "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)");
    }

    resetFlip() {
      this.isFlipped = false;
      if (this.rotator) {
        this.rotator.style.setProperty("--flip-y", "0deg");
        this.rotator.style.removeProperty("--rot-transition");
      }
      if (this.btnFlip) {
        this.btnFlip.classList.remove("is-active-toggle");
      }
    }

    toggleFlip() {
      if (!this.cardData || !this.cardData.backUrl || !this.rotator) return;
      this.isFlipped = !this.isFlipped;
      this.rotator.style.setProperty("--flip-y", this.isFlipped ? "180deg" : "0deg");
      this.rotator.style.setProperty("--rot-transition", "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)");

      if (this.btnFlip) {
        this.btnFlip.classList.toggle("is-active-toggle", this.isFlipped);
      }
    }

    toggleHolo() {
      if (!this.foilContainer) return;
      this.isHoloEnabled = !this.isHoloEnabled;
      if (this.isHoloEnabled) {
        this.foilContainer.classList.remove("is-hidden");
      } else {
        this.foilContainer.classList.add("is-hidden");
      }
      this.updateControlsState();
    }

    setFoilPattern(key) {
      this.currentPatternKey = key;
      const pattern = FOIL_PATTERNS[key] || FOIL_PATTERNS.basic;
      if (this.rotator) {
        this.rotator.style.setProperty("--foil-pattern", pattern.svg);
        this.rotator.style.setProperty("--foil-size", pattern.size);
      }
      if (this.patternSelect) {
        this.patternSelect.value = key;
      }
    }

    toggleAutoTilt() {
      if (this.isAutoTilting) {
        this.stopAutoTilt();
      } else {
        this.startAutoTilt();
      }
    }

    startAutoTilt() {
      this.isAutoTilting = true;
      this.autoTiltStartTime = performance.now();
      if (this.btnAutoTilt) this.btnAutoTilt.classList.add("is-active-toggle");

      const animate = (now) => {
        if (!this.isAutoTilting || !this.rotator) return;
        const t = (now - this.autoTiltStartTime) / 1000;
        const rotX = Math.sin(t * 1.6) * 11;
        const rotY = Math.cos(t * 1.3) * 14 * (this.isFlipped ? -1 : 1);
        const pseudoX = 50 + Math.cos(t * 1.3) * 35;
        const pseudoY = 50 + Math.sin(t * 1.6) * 35;

        this.rotator.style.setProperty("--rot-x", `${rotX.toFixed(2)}deg`);
        this.rotator.style.setProperty("--rot-y", `${rotY.toFixed(2)}deg`);
        this.rotator.style.setProperty("--pseudo-x", `${pseudoX.toFixed(1)}%`);
        this.rotator.style.setProperty("--pseudo-y", `${pseudoY.toFixed(1)}%`);
        this.rotator.style.setProperty("--pseudo-opacity", "0.75");
        this.rotator.style.setProperty("--rot-transition", "transform 0.05s linear");

        this.autoTiltAnimId = requestAnimationFrame(animate);
      };

      this.autoTiltAnimId = requestAnimationFrame(animate);
    }

    stopAutoTilt() {
      this.isAutoTilting = false;
      if (this.autoTiltAnimId) {
        cancelAnimationFrame(this.autoTiltAnimId);
        this.autoTiltAnimId = null;
      }
      if (this.btnAutoTilt) this.btnAutoTilt.classList.remove("is-active-toggle");
      this.resetTilt();
    }

    updateControlsState() {
      if (this.btnToggleHolo) {
        this.btnToggleHolo.classList.toggle("is-active-toggle", this.isHoloEnabled);
      }
      if (this.btnFlip) {
        this.btnFlip.classList.toggle("is-active-toggle", this.isFlipped);
      }
    }
  }

  window.HoloCardStage = HoloCardStage;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (!window.holoStage) window.holoStage = new HoloCardStage();
    });
  } else {
    window.holoStage = new HoloCardStage();
  }
})();
