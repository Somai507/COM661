/* ============================================ */
/* API CONFIG */
/* ============================================ */

const apiBase = "https://naturescapes-api-amrit-czcgaecnefgeeqbq.polandcentral-01.azurewebsites.net/api/assets";

/* ============================================ */
/* MOBILE MENU TOGGLE */
/* ============================================ */

const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const navLinks = document.getElementById("navLinks");

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileMenuToggle.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      mobileMenuToggle.classList.remove("active");
    });
  });
}

/* ============================================ */
/* SET ACTIVE NAV LINK */
/* ============================================ */

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navItems = document.querySelectorAll(".nav-link");

  navItems.forEach(link => {
    const href = link.getAttribute("href");
    link.classList.remove("active");

    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

/* ============================================ */
/* MEDIA LOADING & MANAGEMENT */
/* ============================================ */

const mediaGrid = document.getElementById("mediaGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const emptyState = document.getElementById("emptyState");

async function loadMedia() {
  if (!mediaGrid) return;

  try {
    if (loadingSpinner) {
      loadingSpinner.classList.remove("hidden");
    }

    mediaGrid.innerHTML = "";

    const response = await fetch(apiBase);

    if (!response.ok) {
      throw new Error("Failed to fetch media from Azure Function");
    }

    const data = await response.json();

    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }

    if (!Array.isArray(data) || data.length === 0) {
      if (emptyState) {
        emptyState.classList.remove("hidden");
      }

      mediaGrid.innerHTML = "<p>No media found.</p>";
      updateMediaStats([]);
      return;
    }

    if (emptyState) {
      emptyState.classList.add("hidden");
    }

    const mediaCards = data.map((item, index) => `
      <div class="media-card" style="animation-delay: ${index * 0.1}s">
        <div class="media-card-image">
          ${
            item.fileType && item.fileType.startsWith("video/")
              ? `<video controls style="width: 100%; height: 100%; object-fit: cover;">
                   <source src="${item.fileUrl}" type="${item.fileType}">
                   Your browser does not support video.
                 </video>`
              : `<img src="${item.fileUrl}" alt="${item.title || "Nature image"}" />`
          }
        </div>

        <div class="media-card-content">
          <h3>${item.title || "Untitled"}</h3>
          ${item.category ? `<span class="media-card-category">${item.category}</span>` : ""}
          <p>${item.description || "No description provided"}</p>

          <div class="media-card-actions">
            <button onclick="deleteMedia('${item.id}')" title="Delete this media">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join("");

    mediaGrid.innerHTML = mediaCards;
    updateMediaStats(data);

  } catch (error) {
    console.error("Error loading media:", error);

    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }

    mediaGrid.innerHTML = `
      <p style="text-align: center; color: red;">
        Error loading media from Azure API. Please check your Function URL.
      </p>
    `;
  }
}

/* ============================================ */
/* DELETE MEDIA FROM AZURE */
/* ============================================ */

async function deleteMedia(id) {
  if (!confirm("Are you sure you want to delete this media? This action cannot be undone.")) {
    return;
  }

  try {
    const response = await fetch(`${apiBase}?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }

    showNotification("Media deleted successfully", "success");
    loadMedia();

  } catch (error) {
    console.error("Delete failed:", error);
    showNotification("Failed to delete media: " + error.message, "error");
  }
}

/* ============================================ */
/* UPDATE MEDIA STATISTICS */
/* ============================================ */

function updateMediaStats(dataFromApi = []) {
  const data = Array.isArray(dataFromApi) ? dataFromApi : [];

  const mediaCountEl = document.getElementById("mediaCount");
  const categoryCountEl = document.getElementById("categoryCount");

  if (mediaCountEl) {
    animateCounter(mediaCountEl, data.length);
  }

  if (categoryCountEl) {
    const categories = new Set(
      data.map(item => item.category || "Uncategorized")
    );

    animateCounter(categoryCountEl, categories.size);
  }
}

function animateCounter(element, target) {
  const current = parseInt(element.textContent) || 0;

  if (current === target) {
    element.textContent = target;
    return;
  }

  const step = target > current ? 1 : -1;
  let count = current;

  const interval = setInterval(() => {
    count += step;
    element.textContent = count;

    if (count === target) {
      clearInterval(interval);
    }
  }, 30);
}

/* ============================================ */
/* NOTIFICATIONS */
/* ============================================ */

function showNotification(message, type = "info") {
  const notification = document.createElement("div");

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-weight: 500;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/* ============================================ */
/* SCROLL ANIMATIONS */
/* ============================================ */

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px"
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

/* ============================================ */
/* PAGE INITIALISATION */
/* ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  setActiveNavLink();
  loadMedia();

  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");

    if (navbar) {
      if (window.scrollY > 50) {
        navbar.style.boxShadow = "0 8px 40px rgba(0, 0, 0, 0.5)";
      } else {
        navbar.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
      }
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "g" && !isInputActive()) {
      window.location.href = "gallery.html";
    }

    if (e.key === "u" && !isInputActive()) {
      window.location.href = "upload.html";
    }

    if (e.key === "h" && !isInputActive()) {
      window.location.href = "index.html";
    }
  });
});

function isInputActive() {
  return (
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA"
  );
}

/* ============================================ */
/* UTILITY FUNCTIONS */
/* ============================================ */

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getRandomColor() {
  const colors = ["#ff4da6", "#ff9a9e", "#ffa372", "#ffc8a2", "#ff9a9e"];
  return colors[Math.floor(Math.random() * colors.length)];
}

console.log("%cNatureScapes v1.0", "color: #ff4da6; font-size: 20px; font-weight: bold;");
console.log("%cCloud-Native Multimedia Platform", "color: #ff9a9e; font-size: 14px;");