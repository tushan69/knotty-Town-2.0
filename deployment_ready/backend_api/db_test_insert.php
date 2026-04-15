<?php
// hostinger-deploy/api/db_test_insert.php
header('Content-Type: text/html');
require_once 'config.php';

function pass($msg) { echo "<div style='color:green; margin:5px 0;'>✅ $msg</div>"; }
function fail($msg) { echo "<div style='color:red; margin:5px 0;'>❌ $msg</div>"; }

echo "<h2>Database Insertion Test</h2>";

// 1. Check Connection
if ($conn) {
    pass("Database Connected Successfully.");
} else {
    fail("Database Connection Failed.");
    exit;
}

// 2. Prepare Dummy Product
$testId = "TEST_" . time();
$data = [
    ':id' => $testId,
    ':name' => 'Test Product ' . date('H:i:s'),
    ':price' => 999,
    ':original_price' => 1499,
    ':category' => 'Test Category',
    ':description' => 'This is a test product to verify DB insertion.',
    ':image' => 'https://via.placeholder.com/150', // Dummy URL
    ':back_image' => 'https://via.placeholder.com/150/000000', // Dummy Back Image
    ':rating' => 5.0,
    ':reviews' => json_encode([]),
    ':features' => json_encode(['Test Feature 1', 'Test Feature 2']),
    ':available_sizes' => json_encode(['S', 'M', 'L']),
    ':stock_quantity' => 10,
    ':is_sold_out' => 0,
    ':is_featured' => 0
];

// 3. Attempt Insertion
try {
    $stmt = $conn->prepare("INSERT INTO products (id, name, price, original_price, category, description, image, back_image, rating, reviews, features, available_sizes, stock_quantity, is_sold_out, is_featured) 
    VALUES (:id, :name, :price, :original_price, :category, :description, :image, :back_image, :rating, :reviews, :features, :available_sizes, :stock_quantity, :is_sold_out, :is_featured)");
    
    $stmt->execute($data);
    pass("INSERT Query Executed Successfully.");
    
    // 4. Verify Insertion
    $check = $conn->prepare("SELECT * FROM products WHERE id = :id");
    $check->execute([':id' => $testId]);
    $result = $check->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        pass("Product Retrieved Successfully!");
        echo "<pre>";
        print_r($result);
        echo "</pre>";
        
        // 5. Cleanup
        $del = $conn->prepare("DELETE FROM products WHERE id = :id");
        $del->execute([':id' => $testId]);
        pass("Test Product Cleaned Up (Deleted).");
        
    } else {
        fail("Product Look-up Failed. Data was NOT saved.");
    }
    
} catch (PDOException $e) {
    fail("Insertion Failed: " . $e->getMessage());
}
?>
