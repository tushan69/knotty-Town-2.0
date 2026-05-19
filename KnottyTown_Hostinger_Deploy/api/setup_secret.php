<?php
require_once 'config.php';

$key = 'razorpay_secret';
$secret = 'uJGLr5bQgW6uMFPo2zdMg7Kw';

try {
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val");
    $stmt->execute([
        ':key' => $key,
        ':val' => $secret
    ]);
    echo "Razorpay Secret successfully updated in database.\n";
} catch (PDOException $e) {
    echo "Error updating secret: " . $e->getMessage() . "\n";
}
?>
