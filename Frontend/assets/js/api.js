// SikmaV3/Frontend/assets/js/api.js (REVISI TOTAL FINAL)

const API_BASE_URL = window.sikmaApp?.baseUrl
  ? `${window.sikmaApp.baseUrl}/auth.php`
  : "auth.php";

async function fetchAPI(action, options = {}) {
  const defaultOptions = { method: "POST", headers: {} };
  const mergedOptions = { ...defaultOptions, ...options };

  if (mergedOptions.body instanceof FormData) {
    // Biarkan browser mengatur Content-Type untuk FormData
  } else if (
    typeof mergedOptions.body === "object" &&
    mergedOptions.body !== null
  ) {
    // Ubah objek menjadi URL-encoded string
    const params = new URLSearchParams();
    for (const key in mergedOptions.body) {
      if (mergedOptions.body.hasOwnProperty(key)) {
        params.append(key, mergedOptions.body[key]);
      }
    }
    mergedOptions.body = params.toString();
    if (!mergedOptions.headers["Content-Type"]) {
      mergedOptions.headers["Content-Type"] =
        "application/x-www-form-urlencoded";
    }
  }

  let requestUrl = API_BASE_URL;
  let finalParams;

  if (mergedOptions.method.toUpperCase() === "GET") {
    finalParams = new URLSearchParams(mergedOptions.body || "");
    finalParams.set("action", action);
    requestUrl = `${API_BASE_URL}?${finalParams.toString()}`;
    delete mergedOptions.body;
  } else if (mergedOptions.body instanceof FormData) {
    mergedOptions.body.append("action", action);
  } else {
    // POST with urlencoded
    finalParams = new URLSearchParams(mergedOptions.body || "");
    finalParams.set("action", action);
    mergedOptions.body = finalParams.toString();
  }

  try {
    const response = await fetch(requestUrl, mergedOptions);
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      throw new Error(`Respons server bukan JSON: ${textResponse}`);
    }

    if (!response.ok) {
      throw new Error(
        data?.message || `Kesalahan Server (Status: ${response.status})`
      );
    }
    return data;
  } catch (error) {
    console.error("Fetch API Error:", error);
    return {
      status: "error",
      message: "Masalah jaringan atau koneksi ke server gagal.",
    };
  }
}

const Api = {
  // --- Panggilan ke Backend PHP ---
  register: (formData) => fetchAPI("register", { body: formData }),
  login: (formData) => fetchAPI("login", { body: formData }),
  logout: () => fetchAPI("logout", { body: {} }), // <--- Update di sini!
  checkSession: () => fetchAPI("check_session", { method: "GET" }),

  // ...sisanya tetap...

  saveFullProfileData: (profileDataPayload) => {
    const formData = new FormData();
    for (const key in profileDataPayload) {
      if (profileDataPayload.hasOwnProperty(key)) {
        formData.append(key, profileDataPayload[key]);
      }
    }
    return fetchAPI("save_full_profile", { body: formData });
  },

  getProfileData: () => fetchAPI("get_profile_data", { method: "GET" }),

  getCompanyList: (category = "") => {
    return fetchAPI("get_company_list", {
      method: "GET",
      body: { category: category },
    });
  },

  getCompanyDetails: (companyId) => {
    return fetchAPI("get_company_details", {
      method: "GET",
      body: { company_id: companyId },
    });
  },

  getRecommendations: () => {
    // Cukup panggil action 'get_recommendations'. PHP akan menangani sisanya.
    return fetchAPI("get_recommendations", { method: "GET" });
  },
};
