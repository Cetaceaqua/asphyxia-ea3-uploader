document.addEventListener("DOMContentLoaded", () => {
  // Filter Elements
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

  // Lightbox Modal
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImg");
  const modalTitle = document.getElementById("lightboxTitle");
  const modalDetails = document.getElementById("lightboxDetails");
  const modalDownload = document.getElementById("lightboxDownload");
  const modalClose = document.getElementById("lightboxClose");
  const modalBg = modal?.querySelector(".modal-background");

  const openLightbox = (data) => {
    if (!modal) return;
    modalImg.src = data.url;
    modalTitle.textContent = `${data.title} - ${data.filename}`;
    modalDetails.textContent = `Player: ${data.refid} | Size: ${data.size} | Uploaded: ${new Date(data.time).toLocaleString()}`;
    modalDownload.href = data.url;
    modalDownload.setAttribute("download", data.filename);
    modal.classList.add("is-active");
  };

  const closeLightbox = () => {
    if (!modal) return;
    modal.classList.remove("is-active");
    modalImg.src = "";
  };

  document.querySelectorAll(".btn-preview").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox({
        url: btn.getAttribute("data-url"),
        title: btn.getAttribute("data-title"),
        model: btn.getAttribute("data-model"),
        refid: btn.getAttribute("data-refid"),
        time: btn.getAttribute("data-time"),
        size: btn.getAttribute("data-size"),
        filename: btn.getAttribute("data-filename"),
      });
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeLightbox);
  if (modalBg) modalBg.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-active")) {
      closeLightbox();
    }
  });

  // Delete Handler
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const refid = btn.getAttribute("data-refid");
      const filename = btn.getAttribute("data-filename");

      if (!confirm(`Are you sure you want to delete ${filename}? This action cannot be undone.`)) {
        return;
      }

      try {
        const res = await fetch(`/api/photos/${encodeURIComponent(refid)}/${encodeURIComponent(filename)}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          const card = btn.closest(".photo-card-item");
          if (card) card.remove();
        } else {
          alert(`Failed to delete: ${result.message}`);
        }
      } catch (err) {
        alert(`Request error: ${err}`);
      }
    });
  });
});
