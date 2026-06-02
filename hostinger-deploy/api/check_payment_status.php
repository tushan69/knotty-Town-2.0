<?php
header('Content-Type: application/json');

require_once 'config.php';

// Security Hardening: Rate limit check payment requests to 20 per 60 seconds
knotty_rate_limit('check_payment_status', 20, 60);

require_admin(); // Ensure only admins can check status

$pdo = $conn;

// Get the payment ID from query string
$payment_id = $_GET['payment_id'] ?? '';

if (empty($payment_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Payment ID is required']);
    exit;
}

// Security Hardening: Validate payment ID format strictly to prevent SSRF and injection
if (!preg_match('/^[a-zA-Z0-9_:-]{1,100}$/', $payment_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid Payment ID format']);
    exit;
}

// Fetch Razorpay Key and Secret from settings
$stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('razorpay_key', 'razorpay_secret')");
$stmt->execute();
$settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

$razorpay_key = $settings['razorpay_key'] ?? '';
$razorpay_secret = $settings['razorpay_secret'] ?? '';

if (empty($razorpay_key) || empty($razorpay_secret)) {
    echo json_encode(['status' => 'error', 'message' => 'Razorpay API keys not configured']);
    exit;
}

// Query Razorpay API
$url = "https://api.razorpay.com/v1/payments/" . $payment_id;
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, $razorpay_key . ":" . $razorpay_secret);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200) {
    $data = json_decode($response, true);
    echo json_encode([
        'status' => 'success',
        'data' => [
            'id' => $data['id'],
            'amount' => $data['amount'] / 100, // Convert from paise
            'currency' => $data['currency'],
            'status' => $data['status'],
            'order_id' => $data['order_id'] ?? null,
            'method' => $data['method'],
            'description' => $data['description'],
            'email' => $data['email'],
            'contact' => $data['contact'],
            'created_at' => date('Y-m-d H:i:s', $data['created_at'])
        ]
    ]);
} else {
    $error = json_decode($response, true);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Razorpay API Error: ' . ($error['error']['description'] ?? 'Unknown error'),
        'code' => $http_code
    ]);
}
?>
