<?php
// hostinger-deploy/api/health_check.php
header('Content-Type: text/html');
require_once 'config.php';

function pass($msg) { echo "<div style='color:green; margin:5px 0;'>✅ $msg</div>"; }
function fail($msg) { echo "<div style='color:red; margin:5px 0;'>❌ $msg</div>"; }
function warn($msg) { echo "<div style='color:orange; margin:5px 0;'>⚠️ $msg</div>"; }

echo "<h2>Knotty Town System Health Check</h2>";
echo "<hr>";

// 1. PHP Version
echo "<h3>1. Environment</h3>";
echo "PHP Version: " . phpversion() . "<br>";
if (version_compare(phpversion(), '7.4.0', '>=')) {
    pass("PHP version is sufficient.");
} else {
    fail("PHP version is too old. Recommend 8.0+");
}

// 2. Database Connection
echo "<h3>2. Database Connection</h3>";
try {
    $conn->query("SELECT 1");
    pass("Database connection successful.");
} catch (PDOException $e) {
    fail("Database connection failed: " . $e->getMessage());
    exit; // Critical failure
}

// 3. Table Verification
echo "<h3>3. Table Structure</h3>";
$required_tables = ['products', 'orders', 'order_items', 'settings'];
foreach ($required_tables as $table) {
    try {
        $stmt = $conn->query("SELECT 1 FROM $table LIMIT 1");
        pass("Table <strong>$table</strong> exists.");
    } catch (PDOException $e) {
        if ($table === 'settings') {
            warn("Table <strong>$table</strong> is missing (Optional but recommended).");
        } else {
            fail("Table <strong>$table</strong> is MISSING! Run fix_db.php immediately.");
        }
    }
}

// 4. Critical Columns in 'products'
echo "<h3>4. Product Schema</h3>";
$required_columns = [
    'back_image' => 'Back View Support',
    'stock_quantity' => 'Stock Management',
    'is_sold_out' => 'Auto-Sold Out Logic',
    'is_featured' => 'Featured Toggle'
];

try {
    $stmt = $conn->query("SHOW COLUMNS FROM products");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($required_columns as $col => $feature) {
        if (in_array($col, $columns)) {
            pass("Column <strong>$col</strong> exists ($feature).");
        } else {
            fail("Column <strong>$col</strong> is MISSING! ($feature). Run fix_db.php.");
        }
    }
} catch (PDOException $e) {
    fail("Could not check columns: " . $e->getMessage());
}

// 5. Config Check
echo "<h3>5. Configuration</h3>";
if (isset($allowed_origin) && $allowed_origin === "*") {
    warn("CORS is set to wildcard (*). Safe for testing, but restrict to your domain for strict production security.");
} else {
    pass("CORS origin is configured.");
}

echo "<hr>";
echo "<p>If you see all ✅, your backend is 100% ready.</p>";
?>
