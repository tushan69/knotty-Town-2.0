<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $id = $_GET['id'] ?? null;

    if ($id) {
        // Fetch single product with full details
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            $product['features'] = json_decode($product['features'] ?? '[]');
            $product['reviews'] = json_decode($product['reviews'] ?? '[]');
            $product['availableSizes'] = json_decode($product['available_sizes'] ?? '["S","M","L","XL","XXL"]');
            $product['image'] = $product['image'] ?? '';
            $product['backImage'] = $product['back_image'] ?? null;
            $product['price'] = (float)$product['price'];
            $product['originalPrice'] = isset($product['original_price']) ? (float)$product['original_price'] : null;
            $product['rating'] = (float)$product['rating'];
            $product['stock_quantity'] = (int)($product['stock_quantity'] ?? 100);
            $product['isSoldOut'] = (bool)($product['is_sold_out'] ?? false);
            $product['isFeatured'] = (bool)($product['is_featured'] ?? false);
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
        }
    } else {
        // Fetch products with Pagination to prevent crashes
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 1000;
        $offset = ($page - 1) * $limit;
        
        // Use a single query for count if possible, or skip if not needed
        $count_stmt = $conn->query("SELECT COUNT(*) FROM products");
        $total_items = (int)$count_stmt->fetchColumn();
        $total_pages = ceil($total_items / $limit);

        // Fetch limited set with optimized query
        $stmt = $conn->prepare("SELECT id, name, price, original_price, category, image, back_image, rating, is_sold_out, is_featured, stock_quantity, features, reviews, available_sizes FROM products ORDER BY is_featured DESC, id ASC LIMIT $limit OFFSET $offset");
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($products as &$p) {
            // Processing for Lite View - Fast counting without full decode if possible
            $reviews_str = $p['reviews'] ?? '[]';
            // Simple heuristic to count items in JSON array without full decode
            $p['reviewCount'] = substr_count($reviews_str, '{'); 
            unset($p['reviews']); // Strip heavy reviews
            
            $p['features'] = json_decode($p['features'] ?? '[]'); 
            $p['availableSizes'] = json_decode($p['available_sizes'] ?? '["S","M","L","XL","XXL"]');
            $p['price'] = (float)$p['price'];
            $p['originalPrice'] = isset($p['original_price']) ? (float)$p['original_price'] : null;
            $p['isSoldOut'] = (bool)($p['is_sold_out'] ?? false);
            $p['isFeatured'] = (bool)($p['is_featured'] ?? false);
        }
        
        header("Cache-Control: public, max-age=300"); // Cache for 5 minutes at browser level
        echo json_encode([
            'products' => $products,
            'pagination' => [
                'currentPage' => $page,
                'totalPages' => $total_pages,
                'totalItems' => $total_items,
                'limit' => $limit
            ]
        ]);
    }
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
