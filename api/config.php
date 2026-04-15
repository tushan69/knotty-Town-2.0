<?php
/**
 * KNOTTY TOWN - Hostinger MySQL Configuration
 */

function knotty_is_localhost(): bool {
    $name = $_SERVER['SERVER_NAME'] ?? '';
    $addr = $_SERVER['SERVER_ADDR'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    return $name === 'localhost'
        || $addr === '127.0.0.1'
        || $addr === '::1'
        || (strpos($host, '127.0.0.1:') === 0)
        || (strpos($host, 'localhost:') === 0);
}

$is_localhost = knotty_is_localhost();

$is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

ini_set('session.cookie_httponly', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_secure', $is_https ? '1' : '0');
session_start();

// Show errors for setup/debug phase
if ($is_localhost) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    ini_set('display_errors', 0);
}
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');
error_reporting(E_ALL);

$cors_origin = getenv('CORS_ALLOW_ORIGIN');
if ($cors_origin !== false && $cors_origin !== '') {
    header("Access-Control-Allow-Origin: $cors_origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
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

function knotty_expected_admin_token(): string {
    $t = getenv('ADMIN_TOKEN');
    return ($t !== false && $t !== '') ? $t : 'KNOTTY_ADMIN_SECRET_2026';
}

// --- DATABASE (use hosting panel or .env loader; never commit real credentials) ---
if ($is_localhost) {
    $host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'knotty_town';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
} else {
    // ⚠️ HOSTINGER PRODUCTION CREDENTIALS ⚠️
    // Forcing hardcoded values for production as getenv is unreliable on some Hostinger shared plans
    $host = 'localhost';
    $db_name = 'u627175859_kt';
    $username = 'u627175859_knotty2';
    $password = '&3;PF9so4T';
}

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // --- AUTO-MIGRATION SYSTEM ---
    // Wrap in its own try-catch to avoid crashing entire app if tables aren't ready
    try {
        $result = $conn->query("SHOW TABLES LIKE 'orders'");
        if ($result->rowCount() > 0) {
            $columns = $conn->query("SHOW COLUMNS FROM orders")->fetchAll(PDO::FETCH_COLUMN);
            
            $required_columns = [
                'shipping_price' => "ALTER TABLE orders ADD COLUMN shipping_price DECIMAL(10,2) DEFAULT '0.00' AFTER total",
                'payment_screenshot' => "ALTER TABLE orders ADD COLUMN payment_screenshot LONGTEXT AFTER payment_method",
                'payment_id' => "ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL AFTER payment_screenshot",
                'payment_status' => "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending' AFTER payment_id"
            ];

            foreach ($required_columns as $col => $sql) {
                if (!in_array($col, $columns)) {
                    $conn->exec($sql);
                }
            }
        }
    } catch(Exception $migrationError) {
        error_log("Auto-migration skipped: " . $migrationError->getMessage());
    }
    // ----------------------------
} catch(PDOException $e) {
    // Log the actual error but show a clean message
    error_log("Connection failed: " . $e->getMessage());
    
    // If we're on localhost and the DB is missing, don't throw 500 immediately if possible
    // but the app needs a DB, so we return a helpful error.
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "DATABASE CONNECTION FAILED: " . $e->getMessage(),
        "db_name" => $db_name,
        "db_user" => $username,
        "debug_hint" => $is_localhost ? "Running on Localhost." : "Running on Production."
    ]);
    exit();
}

/**
 * Check if the current request is from an authorized admin user.
 */
function is_admin_authorized() {
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        return true;
    }

    $admin_token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_GET['admin_token'] ?? '';
    if ($admin_token !== '' && hash_equals(knotty_expected_admin_token(), $admin_token)) {
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