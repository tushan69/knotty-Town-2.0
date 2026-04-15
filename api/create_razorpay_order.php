<?php
header('Content-Type: application/json');
require_once 'config.php';

// Allow from any origin
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['amount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Amount is required']);
    exit;
}

// 1. Fetch Razorpay Credentials from DB
try {
    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('razorpay_key', 'razorpay_secret')");
    $stmt->execute();
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $key_id = $settings['razorpay_key'] ?? '';
    $key_secret = $settings['razorpay_secret'] ?? '';

    if (empty($key_id) || empty($key_secret)) {
        throw new Exception("Razorpay keys not configured in settings.");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// 2. Create Order via Razorpay API
$api_url = "https://api.razorpay.com/v1/orders";
$order_data = [
    'amount' => $input['amount'], // Amount in paise
    'currency' => 'INR',
    'receipt' => $input['receipt'] ?? 'receipt_' . uniqid(),
    'payment_capture' => 1 // Auto capture
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "$key_id:$key_secret");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($order_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Razorpay API Connection Error: ' . $error]);
    exit;
}

if ($http_code !== 200) {
    $resp_json = json_decode($response, true);
    http_response_code($http_code);
    echo json_encode(['error' => 'Razorpay Error: ' . ($resp_json['error']['description'] ?? 'Unknown error')]);
    exit;
}

// 3. Return Order ID to Frontend
echo $response;
?>
