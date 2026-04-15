<?php
header('Content-Type: application/json');

require_once 'config.php';
$pdo = $conn; // Map $conn from config.php to $pdo for this script

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'No data provided']);
    exit;
}

$razorpay_payment_id = $data['razorpay_payment_id'];
$razorpay_order_id = $data['razorpay_order_id'];
$razorpay_signature = $data['razorpay_signature'];
$order_id = $data['order_id']; // Our internal Order ID

// Fetch Razorpay Secret from settings
$stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'razorpay_secret' LIMIT 1");
$stmt->execute();
$setting = $stmt->fetch(PDO::FETCH_ASSOC);
$razorpay_secret = $setting ? $setting['setting_value'] : '';

if (!$razorpay_secret) {
    echo json_encode(['status' => 'error', 'message' => 'Payment configuration error (Secret missing)']);
    exit;
}

// Verify signature
// signature = hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, secret)
$generated_signature = hash_hmac('sha256', $razorpay_order_id . "|" . $razorpay_payment_id, $razorpay_secret);

if ($generated_signature === $razorpay_signature) {
    // Payment is genuine
    try {
        $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'PAID', payment_id = ? WHERE id = ?");
        $stmt->execute([$razorpay_payment_id, $order_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Payment verified and order updated']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    // Signature mismatch
    echo json_encode(['status' => 'error', 'message' => 'Invalid payment signature']);
}
?>
