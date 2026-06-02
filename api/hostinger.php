<?php
/**
 * KNOTTY TOWN - Hostinger API Proxy
 * Securely forwards requests to Hostinger's Developer API using the configured token.
 */
require_once 'config.php';
require_admin();

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

if (empty($path)) {
    http_response_code(400);
    echo json_encode(["error" => "Target path required (e.g. ?path=hosting/accounts)"]);
    exit();
}

// Security Hardening: Prevent directory traversal or protocol manipulation (SSRF)
if (strpos($path, '..') !== false || strpos($path, ':') !== false || strpos($path, '//') !== false) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid target path structure (Directory traversal or protocol injection detected)"]);
    exit();
}

// Get Hostinger token from secure settings
$stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'hostinger_api_token'");
$stmt->execute();
$token = $stmt->fetchColumn();

if (!$token) {
    http_response_code(400);
    echo json_encode(["error" => "Hostinger API Token not configured in Studio Settings."]);
    exit();
}

// Base URL for Hostinger API
$baseUrl = "https://api.hostinger.com/v1/";
$targetUrl = $baseUrl . ltrim($path, '/');

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . trim($token),
    "Content-Type: application/json",
    "Accept: application/json"
]);

// Include body for mutation requests
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $data = file_get_contents("php://input");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "CURL Error: " . $error_msg]);
} else {
    http_response_code($http_code);
    header("Content-Type: application/json");
    echo $response;
}

curl_close($ch);
?>
