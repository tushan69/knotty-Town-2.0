<?php
require 'api/config.php';
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS coupons (
        id int(11) NOT NULL AUTO_INCREMENT,
        code varchar(50) NOT NULL UNIQUE,
        discount_amount decimal(10,2) NOT NULL,
        is_used tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        used_at datetime DEFAULT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "Table verified\n";
    
    $stmt = $conn->prepare("INSERT INTO coupons (code, discount_amount) VALUES (:code, :amount)");
    $stmt->execute([':code' => 'TESTCODE', ':amount' => 100]);
    echo "Insert successful\n";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
