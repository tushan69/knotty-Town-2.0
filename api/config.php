<?php
/**
 * KNOTTY TOWN - Hostinger MySQL Configuration
 */

function knotty_is_localhost(): bool {
    $name = $_SERVER['SERVER_NAME'] ?? '';
    $addr = $_SERVER['SERVER_ADDR'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    return ($name === 'localhost'
        || $addr === '127.0.0.1'
        || $addr === '::1'
        || (strpos($host, '127.0.0.1:') === 0)
        || (strpos($host, 'localhost:') === 0));
}

// Ensure REQUEST_METHOD is set (avoids warnings in CLI/CRON)
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
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

// --- SECURITY HARDENING: DYNAMIC CORS ORIGIN WHITELIST ---
$allowed_origins = [
    'https://knottytown.in',
    'https://www.knottytown.in',
    'http://localhost:3000',
    'http://localhost:5173'
];
$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($http_origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $http_origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // If not in whitelist, fallback to production domain for security (block arbitrary domains)
    header("Access-Control-Allow-Origin: https://knottytown.in");
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

/**
 * Custom file-based IP rate limiter to mitigate DDoS, scraping, and brute force attacks.
 */
function knotty_rate_limit(string $endpoint, int $limit = 10, int $period = 60): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    
    // Check for proxy/CDN IP headers securely
    if (isset($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    
    $ip_hash = hash('sha256', $ip);
    $dir = __DIR__ . '/rate_limits';
    
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
            // Fallback: if we cannot create the directory, fail open but log the warning
            error_log("Rate limiting directory could not be created: " . $dir);
            return;
        }
        // Write .htaccess inside to prevent public accessibility
        file_put_contents($dir . '/.htaccess', "Order Deny,Allow\nDeny from all");
    }
    
    $file = $dir . '/' . $ip_hash . '_' . md5($endpoint) . '.json';
    $now = time();
    $requests = [];
    
    if (file_exists($file)) {
        $data = file_get_contents($file);
        $requests = json_decode($data, true) ?: [];
    }
    
    // Keep only timestamps within the active time window
    $requests = array_filter($requests, function($timestamp) use ($now, $period) {
        return ($now - $timestamp) < $period;
    });
    
    if (count($requests) >= $limit) {
        http_response_code(429);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Too many requests. Please try again in ' . $period . ' seconds.'
        ]);
        exit();
    }
    
    $requests[] = $now;
    file_put_contents($file, json_encode(array_values($requests)));
}


function knotty_expected_admin_token(): string {
    $t = getenv('ADMIN_TOKEN');
    return ($t !== false && $t !== '') ? $t : 'KNOTTY_ADMIN_SECRET_2026';
}

// Load secure configuration if available (Git-ignored production credentials)
$secure_env_file = __DIR__ . '/secure_env.php';
if (file_exists($secure_env_file)) {
    require_once $secure_env_file;
}

// --- DATABASE (use hosting panel or .env loader; never commit real credentials) ---
if ($is_localhost) {
    $host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'knotty_town';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
} else {
    // Load from secure_env.php if defined, otherwise fall back safely
    $host = defined('SECURE_DB_HOST') ? SECURE_DB_HOST : 'localhost';
    $db_name = defined('SECURE_DB_NAME') ? SECURE_DB_NAME : 'knotty_town_prod';
    $username = defined('SECURE_DB_USER') ? SECURE_DB_USER : 'root';
    $password = defined('SECURE_DB_PASS') ? SECURE_DB_PASS : '';
}

// Razorpay Credentials (load securely, fallback safely to prevent breaks)
define('RAZORPAY_KEY_ID', defined('SECURE_RAZORPAY_KEY_ID') ? SECURE_RAZORPAY_KEY_ID : (getenv('RAZORPAY_KEY_ID') ?: ''));
define('RAZORPAY_KEY_SECRET', defined('SECURE_RAZORPAY_KEY_SECRET') ? SECURE_RAZORPAY_KEY_SECRET : (getenv('RAZORPAY_KEY_SECRET') ?: ''));

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // --- AUTO-MIGRATION SYSTEM ---
    try {
        // Create settings table if it doesn't exist
        $conn->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        // Sync Products Columns
        $res = $conn->query("SHOW TABLES LIKE 'products'");
        if ($res->rowCount() > 0) {
            $p_cols = $conn->query("SHOW COLUMNS FROM products")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('available_sizes', $p_cols)) {
                $conn->exec("ALTER TABLE products ADD COLUMN available_sizes TEXT DEFAULT NULL AFTER features");
            }
            if (!in_array('stock_quantity', $p_cols)) {
                $conn->exec("ALTER TABLE products ADD COLUMN stock_quantity INT DEFAULT 100 AFTER available_sizes");
            }
        }
        
        // Sync Orders Columns
        $res = $conn->query("SHOW TABLES LIKE 'orders'");
        if ($res->rowCount() > 0) {
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
        error_log("Auto-migration Error: " . $migrationError->getMessage());
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