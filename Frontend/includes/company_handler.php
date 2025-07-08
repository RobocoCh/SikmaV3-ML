<?php
// SikmaV3 - includes/company_handler.php (VERSI FINAL LENGKAP)

/**
 * Mengambil detail lengkap sebuah perusahaan dari database.
 * Fungsi ini mengambil data berdasarkan ID dan melakukan join dengan tabel kategori dan tipe.
 * Kolom-kolom yang berisi data JSON akan di-decode menjadi array PHP.
 */
function handle_get_company_details($pdo) {
    // Validasi input company_id untuk memastikan itu adalah integer
    $companyId = filter_input(INPUT_GET, 'company_id', FILTER_VALIDATE_INT);

    if (!$companyId) {
        return ['status' => 'error', 'message' => 'ID Perusahaan tidak valid.'];
    }

    try {
        // Query SQL untuk mengambil data detail dari tabel companies
        $sql = "SELECT
                    c.*,
                    cat.name as category,
                    ct.name as type
                FROM companies c
                LEFT JOIN company_categories cat ON c.category_id = cat.id
                LEFT JOIN company_types ct ON c.type_id = ct.id
                WHERE c.id = :company_id AND c.is_active = 1";

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':company_id', $companyId, PDO::PARAM_INT);
        $stmt->execute();
        $company = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($company) {
            // Kolom-kolom yang diharapkan berisi data JSON
            $json_columns = [
                'why_intern_here',
                'required_programming_skills',
                'required_frameworks',
                'required_tools',
                'relevant_education_majors'
            ];

            // Looping untuk men-decode setiap kolom JSON
            foreach ($json_columns as $col) {
                if (isset($company[$col])) {
                    // json_decode akan menghasilkan array, atau null jika JSON tidak valid
                    // '?: []' adalah fallback untuk memastikan hasilnya selalu array
                    $company[$col] = json_decode($company[$col], true) ?: [];
                } else {
                    // Jika kolom tidak ada di hasil query, buat array kosong untuk konsistensi
                    $company[$col] = [];
                }
            }
            return ['status' => 'success', 'company' => $company];
        } else {
            // Jika tidak ada perusahaan yang ditemukan dengan ID tersebut
            return ['status' => 'error', 'message' => 'Perusahaan tidak ditemukan.'];
        }
    } catch (PDOException $e) {
        // Catat error database ke log server untuk debugging
        error_log("Error in handle_get_company_details: " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Kesalahan server saat mengambil detail perusahaan.'];
    }
}

/**
 * Mengambil daftar perusahaan untuk ditampilkan di halaman "Jelajahi".
 * Mendukung filter berdasarkan kategori.
 */
function handle_get_company_list($pdo) {
    // Ambil dan bersihkan parameter filter kategori dari URL
    $categoryFilter = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_STRING);

    try {
        // Query dasar untuk mengambil daftar perusahaan
        $sql = "SELECT
                    c.id, c.name, c.description_short, c.logo_url, c.banner_image_url,
                    cat.name as category,
                    ct.name as type
                FROM companies c
                LEFT JOIN company_categories cat ON c.category_id = cat.id
                LEFT JOIN company_types ct ON c.type_id = ct.id
                WHERE c.is_active = 1";

        // Tambahkan kondisi WHERE jika ada filter kategori yang aktif
        if ($categoryFilter && $categoryFilter !== 'Semua Kategori' && $categoryFilter !== '') {
            $sql .= " AND cat.name = :category";
        }
        $sql .= " ORDER BY c.name ASC"; // Urutkan berdasarkan nama perusahaan

        $stmt = $pdo->prepare($sql);

        // Bind parameter filter jika ada
        if ($categoryFilter && $categoryFilter !== 'Semua Kategori' && $categoryFilter !== '') {
            $stmt->bindParam(':category', $categoryFilter, PDO::PARAM_STR);
        }

        $stmt->execute();
        $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return ['status' => 'success', 'companies' => $companies];

    } catch (PDOException $e) {
        error_log("Error in handle_get_company_list: " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Kesalahan server saat mengambil daftar perusahaan.'];
    }
}

/**
 * Jembatan untuk service rekomendasi Python.
 * Mengambil data profil user, mengirimkannya ke service Python, dan mengembalikan hasilnya.
 */
function handle_get_recommendations($pdo) {
    requireLogin(); // Pastikan hanya user yang sudah login yang bisa mendapat rekomendasi
    $userId = $_SESSION['user_id'];

    try {
        // Panggil fungsi yang sudah ada untuk mengambil data profil lengkap
        $fullProfileResponse = handle_get_profile_data($pdo);

        if ($fullProfileResponse['status'] !== 'success') {
             throw new Exception("Gagal mengambil data profil lengkap untuk dikirim ke service ML.");
        }
        
        // Data yang akan dikirim ke Python adalah isi dari 'data'
        $dataForPython = $fullProfileResponse['data'];
        
    } catch (Exception $e) {
        error_log("Error getting user profile for recommendation: " . $e->getMessage());
        return ['status' => 'error', 'message' => 'Gagal mengambil profil user untuk rekomendasi.'];
    }

    $flaskApiUrl = 'http://localhost:5001/recommendations';
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($dataForPython),
            'timeout' => 15, // Set timeout 15 detik
        ],
    ];
    $context  = stream_context_create($options);
    
    // Gunakan @ untuk menekan warning jika service Python tidak aktif, kita handle secara manual
    $resultJson = @file_get_contents($flaskApiUrl, false, $context);

    // Handle jika koneksi ke Python gagal
    if ($resultJson === FALSE) {
        error_log("Gagal terhubung ke service rekomendasi Python di: " . $flaskApiUrl);
        // Sediakan data fallback (misal: 5 perusahaan teratas)
        $fallbackCompanies = handle_get_company_list($pdo);
        if ($fallbackCompanies['status'] === 'success') {
             return ['status' => 'success_fallback', 'data' => array_slice($fallbackCompanies['companies'], 0, 5), 'message' => 'Menampilkan perusahaan populer.'];
        }
        return ['status' => 'error', 'message' => 'Tidak dapat terhubung ke server rekomendasi.'];
    }

    // Decode JSON dari Python untuk memastikan formatnya valid sebelum dikembalikan
    $response_data = json_decode($resultJson, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Respons tidak valid dari Python: " . $resultJson);
        return ['status' => 'error', 'message' => 'Respons tidak valid dari server rekomendasi.'];
    }
    
    // Kembalikan hasilnya agar bisa di-handle oleh auth.php
    return $response_data;
}
?>