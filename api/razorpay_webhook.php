<?php
/**
 * KNOTTY TOWN - Secure Razorpay Webhook handler
 * Verifies payment capture and order updates in the background.
 */

header('Content-Type: application/json');
require_once 'config.php';
$pdo = $conn;

// 1. Retrieve the signature header
$webhook_signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

if (empty($webhook_signature)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing Razorpay signature header']);
    exit;
}

// 2. Fetch the Webhook Secret
$webhook_secret = '';
if (defined('SECURE_RAZORPAY_WEBHOOK_SECRET')) {
    $webhook_secret = SECURE_RAZORPAY_WEBHOOK_SECRET;
} else {
    // Try to load dynamically from settings database if set by the admin
    try {
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'razorpay_webhook_secret' LIMIT 1");
        $stmt->execute();
        $webhook_secret = $stmt->fetchColumn() ?: '';
    } catch (PDOException $e) {
        error_log("Webhook database lookup failed: " . $e->getMessage());
    }
}

if (empty($webhook_secret)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Webhook secret not configured']);
    exit;
}

// 3. Retrieve raw request body and calculate expected signature
$payload = file_get_contents('php://input');
$expected_signature = hash_hmac('sha256', $payload, $webhook_secret);

// 4. Verify signature using constant-time hash_equals to prevent timing attacks
if (!hash_equals($expected_signature, $webhook_signature)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid webhook signature']);
    exit;
}

// 5. Signature matches, process the verified event
$event_data = json_decode($payload, true);
$event_type = $event_data['event'] ?? '';

error_log("Razorpay Webhook Verified: EventType: $event_type");

if ($event_type === 'order.paid' || $event_type === 'payment.captured') {
    $payment = $event_data['payload']['payment']['entity'] ?? null;
    
    if ($payment) {
        $razorpay_payment_id = $payment['id'];
        $razorpay_order_id = $payment['order_id'];
        
        // Find internal order corresponding to this Razorpay Order ID (receipt field)
        $receipt = '';
        if (isset($event_data['payload']['order']['entity']['receipt'])) {
            $receipt = $event_data['payload']['order']['entity']['receipt'];
        } elseif (isset($payment['notes']['receipt'])) {
            $receipt = $payment['notes']['receipt'];
        } elseif (isset($payment['notes']['order_id'])) {
            $receipt = $payment['notes']['order_id'];
        } elseif (isset($payment['description'])) {
            // Check if the description contains our internal ID format, e.g., KT-
            $desc = $payment['description'];
            if (preg_match('/(KT-[A-Z0-9]+)/', $desc, $matches)) {
                $receipt = $matches[1];
            }
        }
        
        if (!empty($receipt)) {
            try {
                // Fetch the order to see if it is not already PAID
                $checkStmt = $pdo->prepare("SELECT id, payment_status FROM orders WHERE id = ?");
                $checkStmt->execute([$receipt]);
                $order = $checkStmt->fetch();
                
                if ($order) {
                    if ($order['payment_status'] !== 'PAID') {
                        $stmt = $pdo->prepare("UPDATE orders SET payment_status = 'PAID', payment_id = ? WHERE id = ?");
                        $stmt->execute([$razorpay_payment_id, $receipt]);
                        
                        // Trigger WhatsApp Notification
                        try {
                            require_once 'whatsapp_service.php';
                            sendWhatsAppNotification($receipt, $pdo);
                        } catch (Exception $waEx) {
                            error_log("Webhook WhatsApp Error: " . $waEx->getMessage());
                        }
                        
                        // Trigger Email Notification
                        try {
                            require_once 'email_service.php';
                            sendOrderEmailNotification($receipt, $pdo);
                        } catch (Exception $emailEx) {
                            error_log("Webhook Email Error: " . $emailEx->getMessage());
                        }
                        
                        error_log("Webhook processed successfully: Order $receipt updated to PAID");
                    } else {
                        error_log("Webhook ignored: Order $receipt is already PAID");
                    }
                } else {
                    error_log("Webhook error: Order $receipt not found in database");
                }
            } catch (PDOException $e) {
                error_log("Webhook DB error processing order $receipt: " . $e->getMessage());
            }
        } else {
            error_log("Webhook error: Could not resolve internal order ID from payload");
        }
    }
}

// Always respond with a 200 to acknowledge receipt of webhook
http_response_code(200);
echo json_encode(['status' => 'success']);
?>
