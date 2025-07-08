// SikmaV3/Frontend/assets/js/page_home.js (FINAL DENGAN KATEGORI 1 BARIS + SEARCH BAR)

const PageHome = {
  recommendationSwiperWrapper: null,
  recommendationSwiperContainer: null,
  noRecommendationsMessage: null,
  companyCategoryFilter: null,
  companyGrid: null,
  noCompanyResultsMessage: null,
  companyListLoading: null,
  recommendationSwiperInstance: null,
  allCompanyData: [],
  isPageInitialized: false,

  initialize: function () {
    if (this.isPageInitialized) return;
    console.log("PageHome: Initializing...");

    this.recommendationSwiperWrapper = UI.getElement(
      "#recommendationSwiperWrapper"
    );
    this.recommendationSwiperContainer = UI.getElement(
      ".recommendation-swiper-container"
    );
    this.noRecommendationsMessage = UI.getElement("#noRecommendationsMessage");
    this.companyCategoryFilter = UI.getElement("#companyCategoryFilter");
    this.companyGrid = UI.getElement("#companyGrid");
    this.noCompanyResultsMessage = UI.getElement("#noCompanyResultsMessage");
    this.companyListLoading = UI.getElement("#companyListLoading");

    this._initCategoryFilter();
    this._initCardClickListeners();
    this.isPageInitialized = true;
  },

  loadPageData: async function () {
    if (!this.isPageInitialized) this.initialize();
    this.resetPageVisuals();
    await this._loadAndDisplayCompanies();
    await this._populateRecommendationSwiper();
  },

  resetPageVisuals: function () {
    if (this.recommendationSwiperInstance) {
      try {
        this.recommendationSwiperInstance.destroy(true, true);
      } catch (e) {}
      this.recommendationSwiperInstance = null;
    }
    if (this.recommendationSwiperWrapper)
      this.recommendationSwiperWrapper.innerHTML = "";
    if (this.companyGrid) this.companyGrid.innerHTML = "";
    if (this.companyCategoryFilter) this.companyCategoryFilter.value = "";
    UI.hideElement(this.noRecommendationsMessage);
    UI.hideElement(this.noCompanyResultsMessage);
    UI.hideElement(this.companyListLoading);
  },

  _loadAndDisplayCompanies: async function () {
    if (!this.companyGrid) return;
    UI.showElement(this.companyListLoading, "block");

    const response = await Api.getCompanyList();
    UI.hideElement(this.companyListLoading);

    if (response.status === "success" && Array.isArray(response.companies)) {
      this.allCompanyData = response.companies;
      this.companyGrid.innerHTML = "";
      if (response.companies.length === 0) {
        UI.showElement(this.noCompanyResultsMessage, "block");
      } else {
        response.companies.forEach((company) => this.addCompanyToGrid(company));
      }
    } else {
      this.companyGrid.innerHTML = `<p class="text-danger">${
        response.message || "Gagal memuat daftar perusahaan."
      }</p>`;
    }
  },

  addCompanyToGrid: function (companyData) {
    if (!this.companyGrid) return;

    const companyId = companyData.id;
    const name = UI.escapeHTML(companyData.name || "Nama Perusahaan");
    const fullCategoryName = companyData.category || "Kategori";
    const typeDisplay = UI.escapeHTML(companyData.type || "Tipe");
    const description = UI.escapeHTML(
      companyData.description_short || "Deskripsi tidak tersedia."
    );

    // === PERUBAHAN UTAMA ADA DI SINI ===
    // 1. Ambil hanya kata pertama dari kategori untuk ditampilkan
    const categoryDisplay = UI.escapeHTML(fullCategoryName.split(" ")[0]);

    // 2. Buat nama kelas CSS dari kata pertama yang sudah bersih
    const tagClass = `tag-${categoryDisplay
      .toLowerCase()
      .replace(/[^a-z0-9-]/gi, "")}`;

    let imageUrl = companyData.banner_image_url || companyData.logo_url;
    if (!imageUrl || !imageUrl.startsWith("http")) {
      imageUrl = `https://placehold.co/325x200/EEE/888?text=${encodeURIComponent(
        name
      )}`;
    }

    const card = document.createElement("div");
    card.className = "company-card";
    card.dataset.category = fullCategoryName; // Tetap simpan nama lengkap untuk filtering

    card.innerHTML = `
      <a href="#" class="company-card-link" data-companyid="${companyId}">
        <div class="company-card-image" style="background-image: url('${UI.escapeHTML(
          imageUrl
        )}');"></div>
        <div class="company-card-info">
          <div class="company-card-about">
            <span class="company-card-tag ${tagClass}">${categoryDisplay}</span>
            <span class="company-card-time">${typeDisplay}</span>
          </div>
          <h3 class="company-card-title">${name}</h3>
          <p class="company-card-description">${description}</p>
          <div class="company-card-footer">
            <span>Lihat Detail <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </a>`;
    this.companyGrid.appendChild(card);
  },

  _populateRecommendationSwiper: async function () {
    if (!this.recommendationSwiperWrapper) return;

    if (
      window.sikmaApp?.isUserLoggedIn &&
      window.sikmaApp.initialUserData?.is_profile_complete
    ) {
      const recommendationsResponse = await Api.getRecommendations();
      if (
        (recommendationsResponse.status === "success" ||
          recommendationsResponse.status === "success_fallback") &&
        recommendationsResponse.data?.length > 0
      ) {
        this.renderRecommendationSlides(recommendationsResponse.data);
        if (recommendationsResponse.status === "success_fallback") {
          this.showNoRecommendationsMessage(
            "Rekomendasi personal gagal, menampilkan perusahaan populer."
          );
        }
      } else {
        this.showNoRecommendationsMessage(
          "Belum ada rekomendasi yang cocok. Lengkapi atau perbarui profil Anda."
        );
      }
    } else {
      this.showNoRecommendationsMessage(
        "Login dan lengkapi profil Anda untuk mendapatkan rekomendasi magang yang dipersonalisasi."
      );
    }
  },

  renderRecommendationSlides: function (companies) {
    if (!this.recommendationSwiperWrapper) return;
    this.recommendationSwiperWrapper.innerHTML = "";
    UI.hideElement(this.noRecommendationsMessage);

    companies.forEach((company) => {
      const matchScore = company.match_percentage
        ? `${company.match_percentage}%`
        : null;
      const companyId = company.id;
      const companyName = UI.escapeHTML(company.name);
      const categoryDisplay = UI.escapeHTML(company.category.split(" ")[0]); // Ambil kata pertama juga di sini
      const description = UI.escapeHTML(
        company.description_short || company.description
      );
      let imageUrl = company.banner_image_url || company.logo_url;
      if (!imageUrl || !imageUrl.startsWith("http")) {
        imageUrl = `https://placehold.co/400x240/EEE/888?text=${encodeURIComponent(
          companyName
        )}`;
      }
      const slide = document.createElement("div");
      slide.className = "swiper-slide recommendation-card";
      slide.style.backgroundImage = `url('${UI.escapeHTML(imageUrl)}')`;

      slide.innerHTML = `
        <a href="#" class="company-card-link" data-companyid="${companyId}">
            <div class="card-overlay"></div>
            <div class="card-content">
                <h3>${companyName}</h3>
                <p class="card-subtitle">${categoryDisplay}</p>
                ${
                  matchScore
                    ? `<div class="recommendation-details"><p class="match-score"><strong>Kecocokan:</strong> <span class="score-value">${matchScore}</span></p></div>`
                    : ""
                }
                <p class="card-description">${description}</p>
                <span class="btn btn-sm btn-primary btn-detail">Lihat Detail <i class="fas fa-arrow-right"></i></span>
            </div>
        </a>`;
      this.recommendationSwiperWrapper.appendChild(slide);
    });
    this._initSwiper();
  },

  showNoRecommendationsMessage: function (message) {
    if (this.noRecommendationsMessage) {
      this.noRecommendationsMessage.innerHTML = `<p><i class="fas fa-info-circle"></i> ${message}</p>`;
      UI.showElement(this.noRecommendationsMessage, "block");
    }
  },

  _initSwiper: function () {
    if (
      this.recommendationSwiperWrapper?.children.length > 0 &&
      typeof Swiper !== "undefined"
    ) {
      if (this.recommendationSwiperInstance)
        this.recommendationSwiperInstance.destroy();
      this.recommendationSwiperInstance = new Swiper(
        this.recommendationSwiperContainer,
        {
          slidesPerView: 1.2,
          spaceBetween: 15,
          loop: this.recommendationSwiperWrapper.children.length > 2,
          autoplay: { delay: 4500, disableOnInteraction: false },
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            640: { slidesPerView: 1.8 },
            768: { slidesPerView: 2.2 },
            1024: { slidesPerView: 2.8 },
            1200: { slidesPerView: 3.2 },
          },
        }
      );
    }
  },

  _initCategoryFilter: function () {
    if (this.companyCategoryFilter) {
      this.companyCategoryFilter.addEventListener("change", () => {
        this.filterCompanyGrid(this.companyCategoryFilter.value);
      });
    }
  },

  filterCompanyGrid: function (selectedCategory) {
    let visibleCount = 0;
    const cards = UI.getAllElements("#companyGrid .company-card");
    cards.forEach((card) => {
      const fullCategory = card.dataset.category;
      const isVisible =
        !selectedCategory ||
        (fullCategory &&
          fullCategory.toLowerCase() === selectedCategory.toLowerCase());
      card.style.display = isVisible ? "flex" : "none";
      if (isVisible) visibleCount++;
    });
    UI.hideElement(this.noCompanyResultsMessage);
    if (visibleCount === 0 && selectedCategory) {
      UI.showElement(this.noCompanyResultsMessage, "block");
    }
  },

  filterCompaniesBySearch: function (searchTerm) {
    // Jika belum load data, abaikan
    if (!this.allCompanyData || this.allCompanyData.length === 0) return;

    const lowerTerm = searchTerm.trim().toLowerCase();

    let visibleCount = 0;
    const cards = UI.getAllElements("#companyGrid .company-card");
    this.allCompanyData.forEach((company, idx) => {
      const name = (company.name || "").toLowerCase();
      const description = (
        company.description_short ||
        company.description ||
        ""
      ).toLowerCase();
      const category = (company.category || "").toLowerCase();

      // Search: cocokkan di nama, kategori, atau deskripsi
      const visible =
        name.includes(lowerTerm) ||
        category.includes(lowerTerm) ||
        description.includes(lowerTerm);
      if (cards[idx]) {
        cards[idx].style.display = visible ? "flex" : "none";
        if (visible) visibleCount++;
      }
    });

    UI.hideElement(this.noCompanyResultsMessage);
    if (visibleCount === 0) {
      UI.showElement(this.noCompanyResultsMessage, "block");
    }
  },

  _initCardClickListeners: function () {
    const mainContent = document.getElementById("mainContentWrapper");
    if (mainContent) {
      mainContent.removeEventListener(
        "click",
        this._handleCardClick.bind(this)
      );
      mainContent.addEventListener("click", this._handleCardClick.bind(this));
    }
  },

  _handleCardClick: function (event) {
    const card = event.target.closest(".recommendation-card, .company-card");
    if (card) {
      const link = card.querySelector("a.company-card-link");
      if (link) {
        event.preventDefault();
        const companyId = link.dataset.companyid;
        if (companyId) {
          this._navigateToCompanyDetail(companyId);
        }
      }
    }
  },

  _navigateToCompanyDetail: function (companyId) {
    if (
      companyId &&
      typeof PageCompanyDetail !== "undefined" &&
      typeof AppCore !== "undefined"
    ) {
      AppCore.navigateToPage("page-company-detail", null, "Detail Perusahaan");
      PageCompanyDetail.displayCompanyDetails(companyId);
    }
  },
};

// Penting: pastikan PageHome global agar AppCore bisa mengaksesnya!
window.PageHome = PageHome;
