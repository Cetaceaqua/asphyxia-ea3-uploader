document.addEventListener("DOMContentLoaded", () => {
  const gameFilter = document.getElementById("gameFilter");
  const userFilter = document.getElementById("userFilter");
  const refreshBtn = document.getElementById("refreshBtn");
  const photoCards = document.querySelectorAll(".photo-card-item");

  const applyFilters = () => {
    const selectedGame = (gameFilter?.value || "").toLowerCase().trim();
    const selectedUser = (userFilter?.value || "").toLowerCase().trim();

    photoCards.forEach((card) => {
      const refid = (card.getAttribute("data-refid") || "").toLowerCase();
      const game = (card.getAttribute("data-game") || "").toLowerCase();
      const model = (card.getAttribute("data-model") || "").toLowerCase();

      const matchesGame =
        !selectedGame ||
        game === selectedGame ||
        model === selectedGame;

      const matchesUser = !selectedUser || refid === selectedUser;

      if (matchesGame && matchesUser) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  };

  if (gameFilter) gameFilter.addEventListener("change", applyFilters);
  if (userFilter) userFilter.addEventListener("change", applyFilters);
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  const modal = document.getElementById("lightboxModal");
  const cardStageSection = document.getElementById("cardStageSection");
  const modalClose = document.getElementById("lightboxClose");
  const modalBg = modal?.querySelector(".modal-background");

  const extractItemData = (el) => {
    const cardEl = el.closest(".photo-card-item") || el;
    let cardMeta = {};
    try {
      const raw = cardEl.getAttribute("data-card-meta");
      if (raw) cardMeta = JSON.parse(raw);
    } catch {}

    return {
      url: cardEl.getAttribute("data-front-url") || cardEl.getAttribute("data-url") || el.getAttribute("data-url"),
      frontUrl: cardEl.getAttribute("data-front-url") || cardEl.getAttribute("data-url"),
      backUrl: cardEl.getAttribute("data-back-url") || "",
      holoUrl: cardEl.getAttribute("data-holo-url") || "",
      irUrl: cardEl.getAttribute("data-ir-url") || "",
      hasHolo: cardEl.getAttribute("data-has-holo") === "true",
      hasBack: cardEl.getAttribute("data-has-back") === "true",
      isCard: cardEl.getAttribute("data-is-card") === "true",
      cardId: cardEl.getAttribute("data-card-id") || "",
      orientation: cardEl.getAttribute("data-orientation") || "portrait",
      title: cardEl.getAttribute("data-game") || el.getAttribute("data-title"),
      model: cardEl.getAttribute("data-model") || el.getAttribute("data-model"),
      type: cardEl.getAttribute("data-type") || el.getAttribute("data-type"),
      refid: cardEl.getAttribute("data-refid") || el.getAttribute("data-refid"),
      time: cardEl.getAttribute("data-time") || el.getAttribute("data-time"),
      size: el.getAttribute("data-size") || "",
      filename: cardEl.getAttribute("data-filename") || el.getAttribute("data-filename"),
      cardMeta,
    };
  };

  const openViewer = (data) => {
    if (!modal) return;

    if (window.holoStage) {
      if (cardStageSection) cardStageSection.style.display = "flex";
      window.holoStage.setCard(data);
    }

    modal.classList.add("is-active");
  };

  const closeViewer = () => {
    if (!modal) return;
    modal.classList.remove("is-active");
    if (window.holoStage) {
      window.holoStage.stopAutoTilt();
      window.holoStage.resetTilt();
      window.holoStage.resetFlip();
    }
  };

  document.querySelectorAll(".btn-preview").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openViewer(extractItemData(btn));
    });
  });

  document.querySelectorAll(".photo-thumb-container").forEach((thumb) => {
    thumb.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      openViewer(extractItemData(thumb));
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeViewer);
  if (modalBg) modalBg.addEventListener("click", closeViewer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-active")) {
      closeViewer();
    }
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const refid = btn.getAttribute("data-refid");
      const filename = btn.getAttribute("data-filename");

      if (!confirm(`Are you sure you want to delete ${filename}? All card files in this set will be removed.`)) {
        return;
      }

      try {
        const res = await fetch(`/api/photos/${encodeURIComponent(refid)}/${encodeURIComponent(filename)}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          const card = btn.closest(".photo-card-item");
          if (card) {
            card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            card.style.opacity = "0";
            card.style.transform = "scale(0.8)";
            setTimeout(() => card.remove(), 300);
          }
        } else {
          alert(`Failed to delete: ${result.message}`);
        }
      } catch (err) {
        alert(`Request error: ${err}`);
      }
    });
  });

  const urlCard = new URLSearchParams(window.location.search).get("card");
  if (urlCard) {
    const targetBtn =
      document.querySelector(`.photo-card-item[data-card-id="${urlCard}"] .btn-preview`) ||
      document.querySelector(`.photo-card-item[data-filename*="${urlCard}"] .btn-preview`);
    if (targetBtn) {
      if (!window.holoStage && window.HoloCardStage) {
        window.holoStage = new window.HoloCardStage();
      }
      openViewer(extractItemData(targetBtn));
    }
  }
});
