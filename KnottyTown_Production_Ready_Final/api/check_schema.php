<?php
require_once 'config.php';

header('Content-Type: text/plain');

try {
    echo "Checking 'orders' table schema...\n";
    $stmt = $conn->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "{$col['Field']} - {$col['Type']} - Null: {$col['Null']}\n";
    }

    echo "\nChecking 'order_items' table schema...\n";
    $stmt = $conn->query("DESCRIBE order_items");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "{$col['Field']} - {$col['Type']} - Null: {$col['Null']}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
