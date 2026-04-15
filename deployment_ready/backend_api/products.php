<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $products = [];
    try {
        $stmt = $conn->prepare("SELECT * FROM products");
        $stmt->execute();
        $fetched = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($fetched) {
            foreach ($fetched as &$p) {
                $p['features'] = json_decode($p['features'] ?? '[]');
                $p['reviews'] = json_decode($p['reviews'] ?? '[]');
                $p['availableSizes'] = json_decode($p['available_sizes'] ?? '["S","M","L","XL","XXL"]');
                $p['price'] = (float)$p['price'];
                $p['originalPrice'] = isset($p['original_price']) ? (float)$p['original_price'] : null;
                $p['rating'] = (float)$p['rating'];
                $p['stock_quantity'] = (int)($p['stock_quantity'] ?? 100);
                $p['isSoldOut'] = (bool)($p['is_sold_out'] ?? false);
                $p['isFeatured'] = (bool)($p['is_featured'] ?? false);
                $p['backImage'] = $p['back_image'] ?? null;
            }
            $products = $fetched;
        }
    } catch (Exception $e) {
        // Log error but return empty array to prevent frontend crash
        error_log("Product fetch failed: " . $e->getMessage());
    }
    echo json_encode($products);
}

if ($method == 'POST') {
    require_admin();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $conn->prepare("INSERT INTO products (id, name, price, original_price, category, description, image, back_image, rating, reviews, features, available_sizes, stock_quantity, is_sold_out, is_featured) 
    VALUES (:id, :name, :price, :original_price, :category, :description, :image, :back_image, :rating, :reviews, :features, :available_sizes, :stock_quantity, :is_sold_out, :is_featured) 
    ON DUPLICATE KEY UPDATE name=:name, price=:price, original_price=:original_price, category=:category, description=:description, image=:image, back_image=:back_image, rating=:rating, reviews=:reviews, features=:features, available_sizes=:available_sizes, stock_quantity=:stock_quantity, is_sold_out=:is_sold_out, is_featured=:is_featured");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':name' => $data['name'],
        ':price' => $data['price'],
        ':original_price' => $data['originalPrice'] ?? null,
        ':category' => $data['category'],
        ':description' => $data['description'],
        ':image' => $data['image'],
        ':back_image' => $data['backImage'] ?? null,
        ':rating' => $data['rating'] ?? 5.0,
        ':reviews' => json_encode($data['reviews'] ?? []),
        ':features' => json_encode($data['features'] ?? []),
        ':available_sizes' => json_encode($data['availableSizes'] ?? ["S","M","L","XL","XXL"]),
        ':stock_quantity' => (int)($data['stock_quantity'] ?? 100),
        ':is_sold_out' => ($data['isSoldOut'] ?? false) ? 1 : 0,
        ':is_featured' => ($data['isFeatured'] ?? false) ? 1 : 0
    ]);
    
    echo json_encode(["status" => "success"]);
}

if ($method == 'DELETE') {
    require_admin();
    $id = $_GET['id'];
    $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(["status" => "deleted"]);
}
?>
