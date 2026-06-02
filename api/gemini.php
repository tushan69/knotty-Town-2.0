<?php
/**
 * KNOTTY TOWN - Secure Google Gemini API Server-Side Proxy
 * Keeps the GEMINI_API_KEY secure on the server.
 */

require_once 'config.php';

// Retrieve API key from secure environments or database settings
$api_key = '';
if (defined('SECURE_GEMINI_API_KEY') && SECURE_GEMINI_API_KEY !== '') {
    $api_key = SECURE_GEMINI_API_KEY;
} else {
    $api_key = getenv('GEMINI_API_KEY') ?: getenv('VITE_GEMINI_API_KEY');
}

// Fallback to database setting if not in environment
if ($api_key === '') {
    try {
        $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        if ($row) {
            $api_key = trim($row['setting_value']);
        }
    } catch (Exception $e) {
        // Safe silence
    }
}

// If key is still missing, return offline status code
if ($api_key === '') {
    http_response_code(503);
    echo json_encode([
        "error" => "SERVICE_OFFLINE",
        "message" => "Gemini API key is unconfigured on the server."
    ]);
    exit();
}

// Parse request payload
$raw_input = file_get_contents('php://input');
$request_data = json_decode($raw_input, true);

if (!$request_data || !isset($request_data['contents'])) {
    http_response_code(400);
    echo json_encode([
        "error" => "BAD_REQUEST",
        "message" => "Invalid Gemini request payload. Required: 'contents'"
    ]);
    exit();
}

// Construct Google API request body
$google_payload = [
    "contents" => $request_data['contents']
];

// Optionally forward systemInstruction if provided
if (isset($request_data['systemInstruction'])) {
    $google_payload['systemInstruction'] = $request_data['systemInstruction'];
}

// Optionally forward generationConfig if provided
if (isset($request_data['generationConfig'])) {
    $google_payload['generationConfig'] = $request_data['generationConfig'];
}

// Execute cURL request to Google Generative AI REST endpoint
$model = $request_data['model'] ?? 'gemini-2.0-flash';
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($google_payload));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Proxy secure execution
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        "error" => "GATEWAY_ERROR",
        "message" => "Failed to communicate with Google AI servers.",
        "details" => $error
    ]);
    exit();
}

// Set matching response status and return Google's payload
http_response_code($http_code);
echo $response;
?>
