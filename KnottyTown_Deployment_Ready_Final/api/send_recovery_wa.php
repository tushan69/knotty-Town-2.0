
<?php
require_once 'config.php';
require_once 'whatsapp_service.php';

header('Content-Type: application/json');
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $phone = $data['phone'] ?? '';
    $name = $data['name'] ?? 'valued customer';

    if (!$phone) {
        echo json_encode(["success" => false, "error" => "No phone number"]);
        exit();
    }

    $success = sendAbandonedCartRecovery($phone, $name, $conn);

    if ($success) {
        $stmt = $conn->prepare("UPDATE abandoned_carts SET status = 'recovered_sent' WHERE phone = :phone");
        $stmt->execute([':phone' => $phone]);
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Failed to send notification"]);
    }
}
?>
