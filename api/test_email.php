<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/email_service.php';

// Generate a dummy order ID
$dummy_order_id = "TEST_" . time();

try {
    // 1. Insert Dummy Order
    $stmt = $conn->prepare("INSERT INTO orders (id, customer_name, customer_email, customer_phone, address, city, pincode, total, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $dummy_order_id,
        "Test User",
        "test@example.com",
        "9876543210",
        "123 Test St",
        "Test City",
        "123456",
        1500.00,
        "Cash on Delivery",
        "Pending"
    ]);

    // 2. Insert Dummy Item
    $stmt_item = $conn->prepare("INSERT INTO order_items (order_id, product_id, name, quantity, price, selected_size) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt_item->execute([
        $dummy_order_id,
        1,
        "Test Silhouette",
        2,
        750.00,
        "M"
    ]);

    echo "Dummy order $dummy_order_id inserted.\n";

    // 3. Test Email Service
    echo "Triggering email service...\n";
    sendOrderEmailNotification($dummy_order_id, $conn);
    echo "Email service completed.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
