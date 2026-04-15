<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $conn->beginTransaction();

        // Save Main Order
        $stmt = $conn->prepare("INSERT INTO orders (id, customer_name, customer_email, customer_phone, address, city, pincode, total, shipping_price, payment_method, payment_screenshot, status) VALUES (:id, :name, :email, :phone, :address, :city, :pincode, :total, :shipping, :method, :screenshot, :status)");
        
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
            ':status' => $data['status'] ?? 'Pending'
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

            // AUTOMATIC STOCK DEDUCTION
            // 1. Reduce stock
            $stmt_stock = $conn->prepare("UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :pid AND stock_quantity >= :qty");
            $stmt_stock->execute([':qty' => $item['quantity'], ':pid' => $item['id']]);

            // 2. Check if out of stock, if so mark sold out
            $stmt_check = $conn->prepare("UPDATE products SET is_sold_out = 1 WHERE id = :pid AND stock_quantity <= 0");
            $stmt_check->execute([':pid' => $item['id']]);
        }

        $conn->commit();
        echo json_encode(["status" => "success", "orderId" => $data['id']]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

// Update Order Status (Admin)
if ($method == 'PUT') {
    require_admin();
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("UPDATE orders SET status = :status WHERE id = :id");
    $stmt->execute([
        ':status' => $data['status'],
        ':id' => $data['id']
    ]);
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