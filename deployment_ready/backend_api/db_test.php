<?php
// hostinger-deploy/api/db_test.php

require_once 'config.php';

header('Content-Type: text/plain');

echo "--- DATABASE CONNECTION TEST ---\n";
echo "Host: " . $host . "\n";
echo "Database: " . $db_name . "\n";
echo "User: " . $username . "\n";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "\n[SUCCESS] Connected effectively to the database!";
} catch(PDOException $e) {
    echo "\n[ERROR] Connection Failed:\n";
    echo $e->getMessage();
}
?>
