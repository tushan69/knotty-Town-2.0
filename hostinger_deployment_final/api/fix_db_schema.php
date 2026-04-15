<?php
require_once 'config.php';

header('Content-Type: text/plain');

try {
    echo "Running Database Fix...\n\n";

    // 1. Check/Add payment_id
    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'payment_id'")->fetchAll();
    if (empty($columns)) {
        $conn->exec("ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL AFTER payment_screenshot");
        echo "[SUCCESS] Added 'payment_id' column.\n";
    } else {
        echo "[INFO] 'payment_id' column already exists.\n";
    }

    // 2. Check/Add payment_status
    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'payment_status'")->fetchAll();
    if (empty($columns)) {
        $conn->exec("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending' AFTER payment_id");
        echo "[SUCCESS] Added 'payment_status' column.\n";
    } else {
        echo "[INFO] 'payment_status' column already exists.\n";
    }

    // 3. Check/Add payment_screenshot
    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'payment_screenshot'")->fetchAll();
    if (empty($columns)) {
        $conn->exec("ALTER TABLE orders ADD COLUMN payment_screenshot LONGTEXT AFTER payment_method");
        echo "[SUCCESS] Added 'payment_screenshot' column.\n";
    } else {
        echo "[INFO] 'payment_screenshot' column already exists.\n";
    }

     // 4. Check/Add shipping_price
     $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'shipping_price'")->fetchAll();
     if (empty($columns)) {
         $conn->exec("ALTER TABLE orders ADD COLUMN shipping_price DECIMAL(10,2) DEFAULT '0.00' AFTER total");
         echo "[SUCCESS] Added 'shipping_price' column.\n";
     } else {
         echo "[INFO] 'shipping_price' column already exists.\n";
     }

    echo "\nDatabase Schema Check Completed.";

} catch (PDOException $e) {
    echo "[ERROR] Database Fix Failed: " . $e->getMessage();
}
?>
