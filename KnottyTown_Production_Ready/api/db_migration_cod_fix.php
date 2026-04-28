<?php
require_once 'config.php';

try {
    // Check if columns exist
    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'payment_id'")->fetchAll();
    if (empty($columns)) {
        $conn->exec("ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL AFTER payment_screenshot");
        echo "Added payment_id column.<br>";
    } else {
        echo "payment_id column already exists.<br>";
    }

    $columns = $conn->query("SHOW COLUMNS FROM orders LIKE 'payment_status'")->fetchAll();
    if (empty($columns)) {
        $conn->exec("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending' AFTER payment_id");
        echo "Added payment_status column.<br>";
    } else {
        echo "payment_status column already exists.<br>";
    }

    echo "Database migration completed successfully.";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>
