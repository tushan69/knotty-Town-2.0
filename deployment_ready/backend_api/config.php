<?php
/**
 * KNOTTY TOWN - Hostinger MySQL Configuration
 */

// Secure session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1); // Only for HTTPS
session_start();

// Show errors for setup/debug phase - change to 0 for production
ini_set('display_errors', 0); 
error_reporting(E_ALL);

// Restrict CORS in production
$allowed_origin = "*"; // Replace with "https://yourdomain.com" after setup
header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Token");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- DATABASE CREDENTIALS ---
// Prefer environment variables for security
$host = getenv('DB_HOST') ?: "localhost"; 
$db_name = getenv('DB_NAME') ?: 'u627175859_admin123'; 
$username = getenv('DB_USER') ?: 'u627175859_Knotty61'; 
$password = getenv('DB_PASS') ?: 'zl3D|>J9/'; 
// ----------------------------

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "DATABASE CONNECTION FAILED."
    ]);
    exit();
}

/**
 * Check if the current request is from an authorized admin user.
 */
function is_admin_authorized() {
    // Basic authorization check
    // 1. Check session (if set during login)
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        return true;
    }
    
    // 2. Check for a custom secret header (useful for dev/scripts)
    $admin_token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if (!empty($admin_token) && $admin_token === 'KNOTTY_ADMIN_SECRET_2026') {
        return true;
    }

    return false;
}

function require_admin() {
    if (!is_admin_authorized()) {
        http_response_code(401);
        echo json_encode(["error" => "UNAUTHORIZED ACCESS. ADMIN ONLY."]);
        exit();
    }
}
?>