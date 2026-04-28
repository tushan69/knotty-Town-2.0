<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $productId = $data['productId'] ?? null;
    $contact = $data['contact'] ?? null;

    if (!$productId || !$contact) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID and Contact are required"]);
        exit();
    }

    try {
        // Ensure table exists
        $conn->exec("CREATE TABLE IF NOT EXISTS `restock_notifications` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `product_id` varchar(50) NOT NULL,
            `contact` varchar(255) NOT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $stmt = $conn->prepare("INSERT INTO restock_notifications (product_id, contact) VALUES (:pid, :contact)");
        $stmt->execute([':pid' => $productId, ':contact' => $contact]);

        echo json_encode(["status" => "success", "message" => "Priority signal received. We will notify you upon the next drop."]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
