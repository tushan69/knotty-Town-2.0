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

// Fetch Razorpay Secret
$razorpay_secret = 'uJGLr5bQgW6uMFPo2zdMg7Kw';

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
        // Check if order exists first
        $checkStmt = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
        $checkStmt->execute([$order_id]);
        $exists = $checkStmt->fetch();

        if ($exists) {
            $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'PAID', payment_id = ? WHERE id = ?");
            $stmt->execute([$razorpay_payment_id, $order_id]);
            
            // Trigger WhatsApp Notification only if order exists
            require_once 'whatsapp_service.php';
            sendWhatsAppNotification($order_id, $pdo);
            
            echo json_encode(['status' => 'success', 'message' => 'Payment verified and order updated']);
        } else {
            // Order doesn't exist yet (this is normal if frontend saves order AFTER verification)
            // Just return success so frontend can proceed to save the order
            echo json_encode(['status' => 'success', 'message' => 'Payment verified. Proceeding to save order.', 'verified_only' => true]);
        }
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    // Signature mismatch
    echo json_encode(['status' => 'error', 'message' => 'Invalid payment signature']);
}
?>
