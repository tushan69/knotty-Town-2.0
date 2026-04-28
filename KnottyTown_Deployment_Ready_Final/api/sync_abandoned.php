
<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $phone = $data['phone'] ?? '';
    $name = $data['name'] ?? '';
    $cart_data = json_encode($data['cart'] ?? []);

    if (!$phone || !$cart_data) {
        echo json_encode(["success" => false, "error" => "Incomplete data"]);
        exit();
    }

    try {
        $stmt = $conn->prepare("INSERT INTO abandoned_carts (phone, name, cart_data) 
                               VALUES (:phone, :name, :cart) 
                               ON DUPLICATE KEY UPDATE name = :name, cart_data = :cart, updated_at = CURRENT_TIMESTAMP");
        $stmt->execute([
            ':phone' => $phone,
            ':name' => $name,
            ':cart' => $cart_data
        ]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid method"]);
}
?>
