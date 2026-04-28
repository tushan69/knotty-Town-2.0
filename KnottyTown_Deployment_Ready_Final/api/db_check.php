<?php
// ENHANCED Database Connection Tester for Hostinger
header('Content-Type: text/html; charset=UTF-8');

echo "<!DOCTYPE html><html><head><title>DB Diagnostic</title>
<style>
    body { font-family: monospace; background: #000; color: #0f0; padding: 20px; line-height: 1.5; }
    .error { color: #f00; font-weight: bold; border: 1px solid #f00; padding: 10px; margin: 10px 0; }
    .success { color: #0f0; font-weight: bold; border: 1px solid #0f0; padding: 10px; margin: 10px 0; }
    .info { color: #aaa; }
    h2 { color: #fff; border-bottom: 2px solid #fff; }
</style>
</head><body>";

echo "<h2>KNOTTY TOWN - DATABASE DIAGNOSTIC</h2>";

// 1. Path Check
echo "[STEP 1] Checking environment...<br>";
echo "Current Directory: " . getcwd() . "<br>";

// 2. config.php Check
if (file_exists('config.php')) {
    echo "[STEP 2] config.php found. Reading content...<br>";
    
    // We parse the file manually to avoid it exiting the script
    $config_content = file_get_contents('config.php');
    
    // Simple regex to extract credentials for verification (masking password)
    preg_match('/\$host\s*=\s*.*"(.+)";/', $config_content, $m_host);
    preg_match('/\$db_name\s*=\s*.*\'(.+)\';/', $config_content, $m_db);
    preg_match('/\$username\s*=\s*.*\'(.+)\';/', $config_content, $m_user);
    
    $c_host = $m_host[1] ?? 'Detection failed';
    $c_db = $m_db[1] ?? 'Detection failed';
    $c_user = $m_user[1] ?? 'Detection failed';

    echo "<div class='info'>";
    echo "Detected Host: " . htmlspecialchars($c_host) . "<br>";
    echo "Detected DB: " . htmlspecialchars($c_db) . "<br>";
    echo "Detected User: " . htmlspecialchars($c_user) . "<br>";
    echo "</div>";

    // Now try connection manually with detected/included variables
    // We include it BUT we wrap it to catch the exit if any
    echo "[STEP 3] Attempting real connection...<br>";
    
    // Define the vars here in case regex failed but include works
    include 'config.php';

    try {
        $test_conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
        $test_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "<div class='success'>[SUCCESS] DATABASE CONNECTED PERFECTLY!</div>";
        
        $stmt = $test_conn->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables found: " . implode(", ", $tables) . "<br>";
        
        if (!in_array('products', $tables)) {
            echo "<div class='error'>[WARNING] The 'products' table is missing. Did you import database.sql?</div>";
        }

    } catch(PDOException $e) {
        echo "<div class='error'>[FAILURE] Connection Failed: " . $e->getMessage() . "</div>";
        echo "<h3>HOW TO FIX:</h3>";
        echo "1. Go to Hostinger Panel > MySQL Databases.<br>";
        echo "2. Check your Database Name (usually looks like u123456789_name).<br>";
        echo "3. Check your Username (usually looks like u123456789_user).<br>";
        echo "4. Open <b>api/config.php</b> and update lines 33-36 with these details.<br>";
    }
} else {
    echo "<div class='error'>[ERROR] config.php NOT FOUND. Ensure you uploaded the api folder correctly.</div>";
}

echo "</body></html>";
?>
