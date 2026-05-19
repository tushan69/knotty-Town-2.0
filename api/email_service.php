<?php
/**
 * Email Notification Service for KNOTTY TOWN
 * Handles sending order confirmations via Email (Hostinger compatible)
 */

function sendOrderEmailNotification($order_id, $pdo) {
    try {
        // 1. Fetch Order Details
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            error_log("Email Error: Order $order_id not found.");
            return false;
        }

        // Fetch Order Items
        $stmt_items = $pdo->prepare("SELECT * FROM order_items WHERE order_id = :id");
        $stmt_items->execute([':id' => $order_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        $email = $order['customer_email'];
        $name = $order['customer_name'];
        $total = $order['total'];
        
        if (empty($email)) {
            error_log("Email Error: No email address provided for order $order_id.");
            return false;
        }

        $items_html = "";
        foreach ($items as $item) {
            $items_html .= "<tr>
                <td style='padding: 10px; border-bottom: 1px solid #ddd;'>" . htmlspecialchars($item['name']) . " (Size: " . htmlspecialchars($item['selected_size']) . ")</td>
                <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: center;'>" . $item['quantity'] . "</td>
                <td style='padding: 10px; border-bottom: 1px solid #ddd; text-align: right;'>₹" . number_format($item['price'], 2) . "</td>
            </tr>";
        }

        // 2. Draft the HTML Email
        $subject = "Your Knotty Town Order Confirmed! (Order #" . $order_id . ")";
        
        $message = "
        <html>
        <head>
            <title>Order Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #222; }
                .header h1 { margin: 0; color: #222; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
                .content { padding: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; padding: 10px; background-color: #f9f9f9; border-bottom: 2px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
                .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Knotty Town</h1>
                </div>
                <div class='content'>
                    <p>Hello <strong>" . htmlspecialchars($name) . "</strong>,</p>
                    <p>Thank you for shopping with us! Your order has been successfully placed and is now being prepared for shipment.</p>
                    
                    <h3>Order Details (ID: " . $order_id . ")</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style='text-align: center;'>Qty</th>
                                <th style='text-align: right;'>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            " . $items_html . "
                        </tbody>
                    </table>
                    
                    <div class='total'>
                        Total: ₹" . number_format($total, 2) . "
                    </div>
                    
                    <p><strong>Shipping Address:</strong><br>
                    " . htmlspecialchars($order['address']) . "<br>
                    " . htmlspecialchars($order['city']) . " - " . htmlspecialchars($order['pincode']) . "</p>
                </div>
                <div class='footer'>
                    <p>If you have any questions, reply to this email.</p>
                    <p>Stay Knotty.<br>— Atelier KNOTTY TOWN</p>
                </div>
            </div>
        </body>
        </html>
        ";

        // 3. Set Headers for Hostinger Email
        // Make sure to create this email address in your Hostinger hPanel -> Emails section
        $sender_email = "knottytown@knottytown.com"; // Replace with your actual Hostinger domain email
        $sender_name = "Knotty Town";

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: " . $sender_name . " <" . $sender_email . ">" . "\r\n";
        $headers .= "Reply-To: " . $sender_email . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        // 4. Send Email
        // Use PHP mail() function which works out-of-the-box on Hostinger if the 'From' header matches a created domain email.
        $success = mail($email, $subject, $message, $headers);
        
        if ($success) {
            return true;
        } else {
            error_log("Email sending failed for order $order_id via mail().");
            // PROD-LIKE SIMULATION: Log to file if email fails or for testing locally
            $log_entry = date('[Y-m-d H:i:s]') . " SIMULATED EMAIL TO $email\nSubject: $subject\n--------------------------\n";
            file_put_contents(__DIR__ . '/email_log.txt', $log_entry, FILE_APPEND);
            return false;
        }
    } catch (Exception $e) {
        error_log("Email Exception: " . $e->getMessage());
        return false;
    }
}
?>
