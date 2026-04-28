<?php
/**
 * ONE-TIME SETUP SCRIPT FOR RAZORPAY LIVE KEYS
 * Run this script by visiting /api/setup_razorpay.php in your browser
 * once deployed, then DELETE THIS FILE immediately for security.
 */

require_once 'config.php';

// Provided Live Credentials
$live_key_id = 'rzp_live_SFDpDwe3qxYPFL';
$live_key_secret = 'uJGLr5bQgW6uMFPo2zdMg7Kw';

try {
    // 1. Update Key ID
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('razorpay_key', :val) ON DUPLICATE KEY UPDATE setting_value = :val");
    $stmt->execute([':val' => $live_key_id]);
    
    // 2. Update Key Secret
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('razorpay_secret', :val) ON DUPLICATE KEY UPDATE setting_value = :val");
    $stmt->execute([':val' => $live_key_secret]);

    echo "<h1>RAZORPAY LIVE CONFIGURATION SUCCESSFUL</h1>";
    echo "<p>Database has been updated with your live credentials.</p>";
    echo "<p style='color: red; font-weight: bold;'>SECURITY WARNING: Please delete this file (api/setup_razorpay.php) from your server immediately.</p>";
} catch (PDOException $e) {
    echo "<h1>CONFIGURATION FAILED</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
