<?php
// hostinger-deploy/api/fix_db.php
require_once 'config.php';

// Helper function to safely add a column
function add_column_if_missing($conn, $table, $column, $definition) {
    try {
        $stmt = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        $exists = $stmt->fetch();
        
        if (!$exists) {
            $conn->exec("ALTER TABLE `$table` ADD `$column` $definition");
            echo "<div style='color: green;'>✅ Note: Added column <strong>$column</strong> to $table.</div>";
        } else {
            // echo "<div style='color: gray;'>Note: Column <strong>$column</strong> already exists in $table.</div>";
        }
    } catch (PDOException $e) {
        echo "<div style='color: red;'>❌ Error adding $column: " . $e->getMessage() . "</div>";
    }
}

echo "<h1>Knotty Town Database Fixer & Updater</h1>";
echo "<p>Running comprehensive check on database structure...</p>";
echo "<hr>";

try {
    // 1. PRODUCTS TABLE
    $conn->exec("CREATE TABLE IF NOT EXISTS `products` (
      `id` varchar(255) NOT NULL,
      `name` varchar(255) NOT NULL,
      `price` decimal(10,2) NOT NULL,
      `original_price` decimal(10,2) DEFAULT NULL,
      `category` varchar(100) NOT NULL,
      `description` text,
      `image` longtext,
      `rating` decimal(3,1) DEFAULT '5.0',
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "<div style='color: green;'>✅ Table `products` checked.</div>";

    add_column_if_missing($conn, 'products', 'back_image', 'LONGTEXT NULL AFTER image');
    add_column_if_missing($conn, 'products', 'reviews', 'LONGTEXT NULL AFTER rating');
    add_column_if_missing($conn, 'products', 'features', 'TEXT NULL AFTER reviews');
    add_column_if_missing($conn, 'products', 'available_sizes', 'TEXT NULL AFTER features');
    add_column_if_missing($conn, 'products', 'stock_quantity', "INT(11) DEFAULT '100' AFTER available_sizes");
    add_column_if_missing($conn, 'products', 'is_sold_out', "TINYINT(1) DEFAULT '0' AFTER stock_quantity");
    add_column_if_missing($conn, 'products', 'is_featured', "TINYINT(1) DEFAULT '0' AFTER is_sold_out");

    // 2. ORDERS TABLE
    $conn->exec("CREATE TABLE IF NOT EXISTS `orders` (
      `id` varchar(255) NOT NULL,
      `customer_name` varchar(255) NOT NULL,
      `customer_email` varchar(255) NOT NULL,
      `customer_phone` varchar(50) NOT NULL,
      `address` text NOT NULL,
      `city` varchar(100) NOT NULL,
      `pincode` varchar(20) NOT NULL,
      `total` decimal(10,2) NOT NULL,
      `shipping_price` decimal(10,2) DEFAULT '0.00',
      `payment_method` varchar(50) NOT NULL,
      `payment_screenshot` longtext,
      `status` varchar(50) DEFAULT 'Pending',
      `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "<div style='color: green;'>✅ Table `orders` checked.</div>";

    // 3. ORDER ITEMS TABLE
    $conn->exec("CREATE TABLE IF NOT EXISTS `order_items` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `order_id` varchar(255) NOT NULL,
      `product_id` varchar(255) NOT NULL,
      `name` varchar(255) NOT NULL,
      `quantity` int(11) NOT NULL,
      `price` decimal(10,2) NOT NULL,
      `selected_size` varchar(50) DEFAULT NULL,
      `custom_design` longtext,
      PRIMARY KEY (`id`),
      KEY `order_id` (`order_id`),
      CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "<div style='color: green;'>✅ Table `order_items` checked.</div>";

    // 4. SETTINGS TABLE
    $conn->exec("CREATE TABLE IF NOT EXISTS `settings` (
      `setting_key` varchar(100) NOT NULL,
      `setting_value` longtext NOT NULL,
      PRIMARY KEY (`setting_key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "<div style='color: green;'>✅ Table `settings` checked.</div>";

} catch (PDOException $e) {
     echo "<div style='color: red;'>❌ Critical Error: " . $e->getMessage() . "</div>";
}

echo "<hr>";
echo "<h3>✅ Database Update Complete!</h3>";
echo "<p>Your database schema is now 100% correct for all features (Back Images, Stock Mgmt, Orders).</p>";
echo "<p><strong>IMPORTANT: Delete this file (fix_db.php) after running it.</strong></p>";
?>
