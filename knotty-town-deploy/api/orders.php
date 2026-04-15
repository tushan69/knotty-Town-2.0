<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $conn->beginTransaction();

        // Save Main Order
        $stmt = $conn->prepare("INSERT INTO orders (id, customer_name, customer_email, customer_phone, address, city, pincode, total, shipping_price, payment_method, payment_screenshot, status, payment_id, payment_status) VALUES (:id, :name, :email, :phone, :address, :city, :pincode, :total, :shipping, :method, :screenshot, :status, :payment_id, :payment_status)");
        
        $stmt->execute([
            ':id' => $data['id'],
            ':name' => $data['customer']['name'],
            ':email' => $data['customer']['email'],
            ':phone' => $data['customer']['phone'],
            ':address' => $data['customer']['address'],
            ':city' => $data['customer']['city'],
            ':pincode' => $data['customer']['pincode'],
            ':total' => $data['total'],
            ':shipping' => $data['shipping_price'] ?? 0,
            ':method' => $data['paymentMethod'],
            ':screenshot' => $data['paymentScreenshot'] ?? null,
            ':status' => $data['status'] ?? 'Pending',
            ':payment_id' => $data['payment_id'] ?? null,
            ':payment_status' => $data['payment_status'] ?? 'Pending'
        ]);

        // Save Order Items
        foreach ($data['items'] as $item) {
            $stmt_item = $conn->prepare("INSERT INTO order_items (order_id, product_id, name, quantity, price, selected_size, custom_design) VALUES (:oid, :pid, :name, :qty, :price, :size, :design)");
            
            // For custom items, the 'image' field contains the base64 design
            $custom_design = null;
            if (isset($item['isCustom']) && $item['isCustom'] === true) {
                $custom_design = $item['image'];
            }

            $stmt_item->execute([
                ':oid' => $data['id'],
                ':pid' => $item['id'],
                ':name' => $item['name'],
                ':qty' => $item['quantity'],
                ':price' => $item['price'],
                ':size' => $item['selectedSize'] ?? 'L',
                ':design' => $custom_design
            ]);
        }

        $conn->commit();
        echo json_encode(["status" => "success", "orderId" => $data['id']]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        // Return actual error for debugging (remove in strict production if sensitive)
        $errorMsg = "Order Save Failed: " . $e->getMessage();
        file_put_contents('error_log.txt', date('[Y-m-d H:i:s] ') . $errorMsg . "\nStack: " . $e->getTraceAsString() . "\nData: " . json_encode($data) . "\n\n", FILE_APPEND);
        echo json_encode(["error" => $errorMsg]);
    }
}

// Update Order Status (Admin)
if ($method == 'PUT') {
    require_admin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $updateFields = ["status = :status"];
    $params = [
        ':status' => $data['status'],
        ':id' => $data['id']
    ];

    if (isset($data['payment_status'])) {
        $updateFields[] = "payment_status = :payment_status";
        $params[':payment_status'] = $data['payment_status'];
    }
    
    if (isset($data['payment_id'])) {
        $updateFields[] = "payment_id = :payment_id";
        $params[':payment_id'] = $data['payment_id'];
    }

    $sql = "UPDATE orders SET " . implode(", ", $updateFields) . " WHERE id = :id";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(["status" => "updated"]);
}

// Delete Order (Admin Permission)
if ($method == 'DELETE') {
    require_admin();
    $id = $_GET['id'];
    $conn->beginTransaction();
    try {
        $stmt1 = $conn->prepare("DELETE FROM order_items WHERE order_id = :id");
        $stmt1->execute([':id' => $id]);
        $stmt2 = $conn->prepare("DELETE FROM orders WHERE id = :id");
        $stmt2->execute([':id' => $id]);
        $conn->commit();
        echo json_encode(["status" => "deleted"]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'GET') {
    if (isset($_GET['id'])) {
        // Fetch single order with items for Tracking
        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = :id");
        $stmt->execute([':id' => $_GET['id']]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($order) {
            $stmt_items = $conn->prepare("SELECT * FROM order_items WHERE order_id = :id");
            $stmt_items->execute([':id' => $_GET['id']]);
            $order['items'] = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($order);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Order not found"]);
        }
    } else {
        // Fetch all orders for Admin Dashboard with Pagination
        require_admin();

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countStmt = $conn->query("SELECT COUNT(*) FROM orders");
        $totalOrders = $countStmt->fetchColumn();
        $totalPages = ceil($totalOrders / $limit);

        // Get paginated orders
        $stmt = $conn->prepare("SELECT * FROM orders ORDER BY date DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Attach items to each order
        foreach ($orders as &$order) {
            $stmt_items = $conn->prepare("SELECT * FROM order_items WHERE order_id = :id");
            $stmt_items->execute([':id' => $order['id']]);
            $order['items'] = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            "orders" => $orders,
            "pagination" => [
                "currentPage" => $page,
                "totalPages" => $totalPages,
                "totalOrders" => $totalOrders,
                "limit" => $limit
            ]
        ]);
    }
}
?>