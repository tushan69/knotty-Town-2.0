
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    if (!$user_id) exit();

    $stmt = $conn->prepare("SELECT cart_data FROM user_carts WHERE user_id = :uid");
    $stmt->execute([':uid' => $user_id]);
    $result = $stmt->fetch();
    
    echo json_encode(["cart" => $result ? json_decode($result['cart_data']) : []]);
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? null;
    $cart_json = json_encode($data['cart'] ?? []);

    if (!$user_id) exit();

    $stmt = $conn->prepare("INSERT INTO user_carts (user_id, cart_data) 
                           VALUES (:uid, :cart) 
                           ON DUPLICATE KEY UPDATE cart_data = :cart");
    $stmt->execute([
        ':uid' => $user_id,
        ':cart' => $cart_json
    ]);

    echo json_encode(["status" => "synced"]);
}
?>
