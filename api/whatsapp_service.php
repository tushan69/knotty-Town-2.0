<?php
/**
 * WhatsApp Notification Service for KNOTTY TOWN
 * Handles sending order confirmations via WhatsApp API
 */

require_once 'config.php';

function sendWhatsAppNotification($order_id, $pdo) {
    try {
        // 1. Fetch Order Details
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            error_log("WhatsApp Error: Order $order_id not found.");
            return false;
        }

        $phone = $order['customer_phone'];
        $name = $order['customer_name'];
        $total = $order['total'];
        
        // Format phone number (ensure it has country code, default to +91 for India)
        $clean_phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($clean_phone) == 10) {
            $clean_phone = '91' . $clean_phone;
        }

        // 2. Draft the "Nice Message" (Premium Cinematic Bio)
        $message = "✨ *KNOTTY TOWN | ORDER CONFIRMED* ✨\n\n";
        $message .= "Hello " . explode(' ', trim($name))[0] . ",\n\n";
        $message .= "Thank you for choosing KNOTTY TOWN. Your order for the latest silhouettes has been successfully confirmed.\n\n";
        $message .= "📦 *Order ID:* " . $order_id . "\n";
        $message .= "💰 *Total:* ₹" . number_format($total, 2) . "\n";
        $message .= "📍 *Status:* Prepared for Shipment\n\n";
        $message .= "We are now preparing your pieces with the utmost care. You will receive a tracking link as soon as your order leaves our atelier.\n\n";
        $message .= "Stay Knotty.\n";
        $message .= "— Atelier KNOTTY TOWN";
        
        // 3. Fetch WhatsApp API settings from database
        $stmt_settings = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('whatsapp_instance_id', 'whatsapp_token', 'whatsapp_api_url')");
        $stmt_settings->execute();
        $settings = $stmt_settings->fetchAll(PDO::FETCH_KEY_PAIR);

        $api_url = $settings['whatsapp_api_url'] ?? '';
        $token = $settings['whatsapp_token'] ?? '';
        $instance_id = $settings['whatsapp_instance_id'] ?? '';

        // 4. Send Message (using a generic API format or Twilio/Interakt)
        if (!empty($api_url)) {
            // This is a generic implementation for third-party WhatsApp gateways (like Wati, Interakt, or ultra-msg)
            $post_data = [
                'token' => $token,
                'to' => $clean_phone,
                'body' => $message
            ];

            $ch = curl_init($api_url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            curl_close($ch);
            
            error_log("WhatsApp API Response: " . $response);
            return true;
        } else {
            // PROD-LIKE SIMULATION: Log to file if no API is configured
            // In a real e-commerce setup, this allows the shop owner to see the messages being "sent" 
            // before they connect a paid API.
            $log_entry = date('[Y-m-d H:i:s]') . " SIMULATED WHATSAPP TO $clean_phone\n$message\n--------------------------\n";
            file_put_contents(__DIR__ . '/whatsapp_log.txt', $log_entry, FILE_APPEND);
            return true;
        }
    } catch (Exception $e) {
        error_log("WhatsApp Exception: " . $e->getMessage());
        return false;
    }
function sendAbandonedCartRecovery($phone, $name, $pdo) {
    try {
        $clean_phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($clean_phone) == 10) {
            $clean_phone = '91' . $clean_phone;
        }

        $message = "🕶️ *KNOTTY TOWN | FORGET SOMETHING?* ✨\n\n";
        $message .= "Hello " . (explode(' ', trim($name))[0] ?: 'there') . ",\n\n";
        $message .= "Your selected silhouettes are still waiting at the atelier. We've reserved your cart, but our drops move fast.\n\n";
        $message .= "🔗 *Complete Your Drop:* " . "https://knottytown.in/cart" . "\n\n";
        $message .= "Don't miss out on the aesthetic.\n";
        $message .= "— Atelier KNOTTY TOWN";

        // Fetch WhatsApp API settings
        $stmt_settings = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('whatsapp_instance_id', 'whatsapp_token', 'whatsapp_api_url')");
        $stmt_settings->execute();
        $settings = $stmt_settings->fetchAll(PDO::FETCH_KEY_PAIR);

        $api_url = $settings['whatsapp_api_url'] ?? '';
        $token = $settings['whatsapp_token'] ?? '';

        if (!empty($api_url)) {
            $post_data = ['token' => $token, 'to' => $clean_phone, 'body' => $message];
            $ch = curl_init($api_url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post_data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            curl_close($ch);
            return true;
        } else {
            $log_entry = date('[Y-m-d H:i:s]') . " SIMULATED RECOVERY TO $clean_phone\n$message\n--------------------------\n";
            file_put_contents(__DIR__ . '/whatsapp_log.txt', $log_entry, FILE_APPEND);
            return true;
        }
    } catch (Exception $e) {
        error_log("WhatsApp Recovery Error: " . $e->getMessage());
        return false;
    }
}
?>
