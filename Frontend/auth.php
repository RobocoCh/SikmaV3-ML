<?php
// SikmaV3 - auth.php (Router Utama Backend - VERSI FINAL PALING STABIL)

if (session_status() == PHP_SESSION_NONE) {
    // session_start() akan dipanggil oleh session_utils.php
}
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db_connect.php';
require_once __DIR__ . '/includes/session_utils.php';
require_once __DIR__ . '/includes/user_handler.php';
require_once __DIR__ . '/includes/company_handler.php';
require_once __DIR__ . '/includes/profile_data_handler.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$response = ['status' => 'error', 'message' => 'Aksi tidak valid atau tidak diberikan.'];

try {
    switch ($action) {
        // User Auth & Management
        case 'register':
            $response = handle_register($pdo);
            break;
        case 'login':
            $response = handle_login($pdo);
            break;
        case 'logout':
            $response = handle_logout();
            break;
        case 'check_session':
            $response = handle_check_session($pdo);
            break;
        case 'change_password':
            $response = handle_change_password($pdo);
            break;

        // Profile Data
        case 'save_full_profile':
            $response = handle_save_full_profile($pdo);
            break;
        case 'get_profile_data':
            $response = handle_get_profile_data($pdo);
            break;
        
        case 'update_profile':
            $response = handle_update_profile($pdo);
            break;

        // Company Data
        case 'get_company_details':
            $response = handle_get_company_details($pdo);
            break;
        case 'get_company_list':
            $response = handle_get_company_list($pdo);
            break;

        // Recommendation Service
        case 'get_recommendations':
            $response = handle_get_recommendations($pdo);
            break;

        default:
            // Biarkan respons error default
            http_response_code(400); // Bad Request
            error_log("Aksi tidak dikenal diterima: " . htmlspecialchars($action));
            break;
    }
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    error_log("Fatal error di auth.php: " . $e->getMessage());
    $response = ['status' => 'error', 'message' => 'Terjadi kesalahan internal pada server.'];
}

// Semua hasil akan di-encode dan di-echo di satu tempat ini.
echo json_encode($response);
exit;