<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $key = $_GET['key'] ?? 'qr_code_image';
    $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = :key");
    $stmt->execute([':key' => $key]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(["value" => $result ? $result['setting_value'] : '']);
}

if ($method == 'POST') {
    require_admin();
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['key']) || !isset($data['value'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid data"]);
        exit();
    }
    
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val");
    $stmt->execute([
        ':key' => $data['key'],
        ':val' => $data['value']
    ]);
    
    echo json_encode(["status" => "success"]);
}
?>
