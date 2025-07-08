// SikmaV3 - assets/js/page_company_detail.js (REVISI TOTAL FINAL)

const PageCompanyDetail = {
  // DOM Elements
  pageContainer: null,
  loadingIndicator: null,
  errorMessageDiv: null,
  contentContainer: null,

  companyNameEl: null,
  companyCategoryTagEl: null,
  companyTypeEl: null,
  companyLogoEl: null,
  companyBannerImgEl: null,
  companyLongDescriptionEl: null,
  // Kontainer baru untuk semua keahlian
  companySkillsAndEducationSectionContainer: null,
  companyAddressEl: null,
  companyWebsiteLinkEl: null,
  companyWebsiteItemEl: null,
  companyEmailLinkEl: null,
  companyEmailItemEl: null,
  companyPhoneEl: null,
  companyPhoneItemEl: null,
  whyInternCompanyNameEl: null,
  whyInternListEl: null,
  internshipInfoEl: null,
  backToExploreBtn: null,

  currentCompanyId: null,
  isPageInitialized: false,

  initialize: () => {
    if (PageCompanyDetail.isPageInitialized) return;
    console.log("PageCompanyDetail: Initializing...");

    PageCompanyDetail.pageContainer = UI.getElement("#page-company-detail");
    PageCompanyDetail.loadingIndicator = UI.getElement("#companyDetailLoading");
    PageCompanyDetail.errorMessageDiv = UI.getElement(
      "#companyDetailErrorMessage"
    );
    PageCompanyDetail.contentContainer = UI.getElement(
      "#companyDetailContentContainer"
    );

    // Cache semua elemen DOM
    PageCompanyDetail.companyNameEl = UI.getElement("#companyDetailName");
    PageCompanyDetail.companyCategoryTagEl = UI.getElement(
      "#companyDetailCategoryTag"
    );
    PageCompanyDetail.companyTypeEl = UI.getElement("#companyDetailType");
    PageCompanyDetail.companyLogoEl = UI.getElement("#companyDetailLogo");
    PageCompanyDetail.companyBannerImgEl = UI.getElement(
      "#companyDetailBannerImg"
    );
    PageCompanyDetail.companyLongDescriptionEl = UI.getElement(
      "#companyDetailLongDescription"
    );
    PageCompanyDetail.companySkillsAndEducationSectionContainer = UI.getElement(
      "#companySkillsAndEducationSection"
    );
    PageCompanyDetail.companyAddressEl = UI.getElement("#companyDetailAddress");
    PageCompanyDetail.companyWebsiteLinkEl = UI.getElement(
      "#companyDetailWebsite"
    );
    PageCompanyDetail.companyWebsiteItemEl = UI.getElement(
      "#companyDetailWebsiteItem"
    );
    PageCompanyDetail.companyEmailLinkEl = UI.getElement("#companyDetailEmail");
    PageCompanyDetail.companyEmailItemEl = UI.getElement(
      "#companyDetailEmailItem"
    );
    PageCompanyDetail.companyPhoneEl = UI.getElement("#companyDetailPhone");
    PageCompanyDetail.companyPhoneItemEl = UI.getElement(
      "#companyDetailPhoneItem"
    );
    PageCompanyDetail.whyInternCompanyNameEl = UI.getElement(
      "#whyInternCompanyName"
    );
    PageCompanyDetail.whyInternListEl = UI.getElement(
      "#companyDetailWhyIntern"
    );
    PageCompanyDetail.internshipInfoEl = UI.getElement(
      "#companyDetailInternshipInfo"
    );
    PageCompanyDetail.backToExploreBtn = UI.getElement("#backToExploreBtn");

    if (PageCompanyDetail.backToExploreBtn) {
      PageCompanyDetail.backToExploreBtn.addEventListener(
        "click",
        PageCompanyDetail._handleBackButtonClick
      );
    }
    PageCompanyDetail.isPageInitialized = true;
  },

  _handleBackButtonClick: () => {
    if (AppCore && typeof AppCore.navigateToPage === "function") {
      AppCore.navigateToPage(
        "page-home",
        UI.getElement('a[data-page="page-home"]'),
        "Dashboard"
      );
    }
  },

  preparePage: () => {
    if (!PageCompanyDetail.isPageInitialized) PageCompanyDetail.initialize();
    if (
      !PageCompanyDetail.currentCompanyId &&
      PageCompanyDetail.contentContainer.style.display !== "none"
    ) {
      PageCompanyDetail.resetPage();
      UI.showElement(PageCompanyDetail.errorMessageDiv, "block");
      PageCompanyDetail.errorMessageDiv.innerHTML = `<p><i class="fas fa-info-circle"></i> Pilih perusahaan dari halaman utama untuk melihat detailnya.</p>`;
    }
  },

  resetPage: () => {
    console.log("PageCompanyDetail: Resetting page content...");
    if (PageCompanyDetail.contentContainer)
      UI.hideElement(PageCompanyDetail.contentContainer);
    if (PageCompanyDetail.loadingIndicator)
      UI.hideElement(PageCompanyDetail.loadingIndicator);
    if (PageCompanyDetail.errorMessageDiv)
      UI.hideElement(PageCompanyDetail.errorMessageDiv);
    if (PageCompanyDetail.companySkillsAndEducationSectionContainer)
      PageCompanyDetail.companySkillsAndEducationSectionContainer.innerHTML =
        "";
    PageCompanyDetail.currentCompanyId = null;
  },

  displayCompanyDetails: async (companyId) => {
    if (!companyId) {
      console.error("PageCompanyDetail: Company ID is required.");
      return;
    }
    if (!PageCompanyDetail.isPageInitialized) PageCompanyDetail.initialize();

    PageCompanyDetail.currentCompanyId = companyId;

    if (AppCore.activePageId !== "page-company-detail") {
      AppCore.navigateToPage(
        "page-company-detail",
        null,
        "Memuat Detail Perusahaan..."
      );
    } else {
      document.title = `${
        window.sikmaApp.appName || "SIKMA"
      } - Memuat Detail Perusahaan...`;
    }

    UI.hideElement(PageCompanyDetail.contentContainer);
    UI.hideElement(PageCompanyDetail.errorMessageDiv);
    UI.showElement(PageCompanyDetail.loadingIndicator, "block");

    const response = await Api.getCompanyDetails(companyId);
    UI.hideElement(PageCompanyDetail.loadingIndicator);

    if (response.status === "success" && response.company) {
      PageCompanyDetail._populateCompanyData(response.company);
      UI.showElement(PageCompanyDetail.contentContainer, "block");
      document.title = `${window.sikmaApp.appName || "SIKMA"} - ${
        response.company.name || "Detail Perusahaan"
      }`;
    } else {
      UI.showElement(PageCompanyDetail.errorMessageDiv, "block");
      PageCompanyDetail.errorMessageDiv.innerHTML = `<p><i class="fas fa-exclamation-triangle"></i> ${UI.escapeHTML(
        response.message || "Gagal memuat detail perusahaan."
      )}</p>`;
      document.title = `${
        window.sikmaApp.appName || "SIKMA"
      } - Error Memuat Data`;
    }
  },

  _populateCompanyData: (companyData) => {
    // Populate Header
    PageCompanyDetail.companyNameEl.textContent = UI.escapeHTML(
      companyData.name || "Nama Tidak Tersedia"
    );
    if (PageCompanyDetail.companyCategoryTagEl)
      PageCompanyDetail.companyCategoryTagEl.textContent = UI.escapeHTML(
        companyData.category || "Kategori"
      );
    if (PageCompanyDetail.companyTypeEl)
      PageCompanyDetail.companyTypeEl.textContent = UI.escapeHTML(
        companyData.type || "Tipe"
      );

    // Populate Images
    const defaultBanner =
      "https://placehold.co/800x380/eee/ccc?text=Banner+Perusahaan";
    const defaultLogo = "https://placehold.co/100x100/ccc/999?text=Logo";
    if (PageCompanyDetail.companyLogoEl)
      PageCompanyDetail.companyLogoEl.src = companyData.logo_url || defaultLogo;
    if (PageCompanyDetail.companyBannerImgEl)
      PageCompanyDetail.companyBannerImgEl.src =
        companyData.banner_image_url || defaultBanner;

    // Populate Descriptions
    if (PageCompanyDetail.companyLongDescriptionEl)
      PageCompanyDetail.companyLongDescriptionEl.innerHTML = (
        companyData.description_long || "Deskripsi tidak tersedia."
      ).replace(/\n/g, "<br>");
    if (PageCompanyDetail.internshipInfoEl)
      PageCompanyDetail.internshipInfoEl.innerHTML = (
        companyData.internship_application_info ||
        "Informasi lebih lanjut dapat ditanyakan langsung ke perusahaan."
      ).replace(/\n/g, "<br>");
    if (PageCompanyDetail.whyInternCompanyNameEl)
      PageCompanyDetail.whyInternCompanyNameEl.textContent = UI.escapeHTML(
        companyData.name || "Perusahaan Ini"
      );

    if (PageCompanyDetail.whyInternListEl) {
      PageCompanyDetail.whyInternListEl.innerHTML = "";
      if (
        Array.isArray(companyData.why_intern_here) &&
        companyData.why_intern_here.length > 0
      ) {
        companyData.why_intern_here.forEach((point) => {
          const li = document.createElement("li");
          li.textContent = UI.escapeHTML(point);
          PageCompanyDetail.whyInternListEl.appendChild(li);
        });
      } else {
        PageCompanyDetail.whyInternListEl.innerHTML =
          "<li>Informasi tidak tersedia.</li>";
      }
    }

    if (PageCompanyDetail.companySkillsAndEducationSectionContainer) {
      let skillsHTML = "";
      const createSkillSectionHTML = (title, iconClass, items) => {
        if (!items || items.length === 0) return "";
        let tagsHTML = items
          .map((item) => `<span class="tech-tag">${UI.escapeHTML(item)}</span>`)
          .join("");
        return `
                <section class="company-section">
                    <h2><i class="${iconClass}"></i> ${title}</h2>
                    <div class="relevant-tech-tags">${tagsHTML}</div>
                </section>`;
      };
      skillsHTML += createSkillSectionHTML(
        "Pendidikan Relevan",
        "fas fa-graduation-cap",
        companyData.relevant_education_majors
      );
      skillsHTML += createSkillSectionHTML(
        "Bahasa Pemrograman Dicari",
        "fas fa-code",
        companyData.required_programming_skills
      );
      skillsHTML += createSkillSectionHTML(
        "Framework Dicari",
        "fas fa-cubes",
        companyData.required_frameworks
      );
      skillsHTML += createSkillSectionHTML(
        "Tools yang Digunakan",
        "fas fa-tools",
        companyData.required_tools
      );
      PageCompanyDetail.companySkillsAndEducationSectionContainer.innerHTML =
        skillsHTML;
    }

    // Populate Contact Info
    if (PageCompanyDetail.companyAddressEl)
      PageCompanyDetail.companyAddressEl.textContent = UI.escapeHTML(
        companyData.address || "Tidak tersedia"
      );
    const setupContactLink = (linkEl, itemEl, value, type) => {
      if (value && value.trim() !== "" && value.trim() !== "#") {
        linkEl.textContent = UI.escapeHTML(value);
        if (type === "website")
          linkEl.href = value.startsWith("http") ? value : `https://${value}`;
        else if (type === "email") linkEl.href = `mailto:${value}`;
        UI.showElement(itemEl, "flex");
      } else {
        UI.hideElement(itemEl);
      }
    };
    setupContactLink(
      PageCompanyDetail.companyWebsiteLinkEl,
      PageCompanyDetail.companyWebsiteItemEl,
      companyData.website_url,
      "website"
    );
    setupContactLink(
      PageCompanyDetail.companyEmailLinkEl,
      PageCompanyDetail.companyEmailItemEl,
      companyData.email_contact,
      "email"
    );
    if (
      PageCompanyDetail.companyPhoneEl &&
      PageCompanyDetail.companyPhoneItemEl
    ) {
      if (
        companyData.phone_contact &&
        companyData.phone_contact.trim() !== ""
      ) {
        PageCompanyDetail.companyPhoneEl.textContent = UI.escapeHTML(
          companyData.phone_contact
        );
        UI.showElement(PageCompanyDetail.companyPhoneItemEl, "flex");
      } else {
        UI.hideElement(PageCompanyDetail.companyPhoneItemEl);
      }
    }
  },
};
