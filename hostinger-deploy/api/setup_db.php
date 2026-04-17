<?php
require_once 'config.php';

echo "<html><head><title>KNOTTY TOWN | DB Setup</title></head><body style='font-family:sans-serif; padding:40px; background:#F8F8F8;'>";
echo "<div style='max-width:600px; margin:0 auto; background:white; padding:40px; border:4px solid black; box-shadow:10px 10px 0px black;'>";
echo "<h1 style='font-family:serif; font-style:italic;'>KNOTTY TOWN INITIALIZATION</h1>";

try {
    // Basic security check: Don't allow setup if users table already exists
    $check = $conn->query("SHOW TABLES LIKE 'users'");
    if ($check->rowCount() > 0 && !isset($_GET['force'])) {
        echo "<p style='color:orange; font-weight:bold;'>[SECURITY] DATABASE ALREADY INITIALIZED. SCRIPT LOCKED.</p>";
        echo "<p>Delete the 'users' table or add '?force=1' to the URL if you really need to reset (DANGEROUS).</p>";
        exit();
    }

    $sql = "
    CREATE TABLE IF NOT EXISTS `users` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `google_id` varchar(255) DEFAULT NULL,
      `name` varchar(255) NOT NULL,
      `email` varchar(255) NOT NULL,
      `password` varchar(255) DEFAULT NULL,
      `is_admin` tinyint(1) DEFAULT '0',
      `picture` text,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `email` (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `user_carts` (
      `user_id` int(11) NOT NULL,
      `cart_data` longtext NOT NULL,
      `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `settings` (
      `setting_key` varchar(100) NOT NULL,
      `setting_value` longtext NOT NULL,
      PRIMARY KEY (`setting_key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `products` (
      `id` varchar(50) NOT NULL,
      `name` varchar(255) NOT NULL,
      `price` decimal(10,2) NOT NULL,
      `original_price` decimal(10,2) DEFAULT NULL,
      `category` varchar(100) NOT NULL,
      `description` text NOT NULL,
      `image` longtext NOT NULL,
      `back_image` longtext,
      `rating` decimal(3,1) DEFAULT '5.0',
      `reviews` longtext,
      `features` text,
      `available_sizes` text,
      `stock_quantity` int(11) DEFAULT '100',
      `is_sold_out` tinyint(1) DEFAULT '0',
      `is_featured` tinyint(1) DEFAULT '0',
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `orders` (
      `id` varchar(50) NOT NULL,
      `date` datetime DEFAULT CURRENT_TIMESTAMP,
      `customer_name` varchar(255) NOT NULL,
      `customer_email` varchar(255) NOT NULL,
      `customer_phone` varchar(20) NOT NULL,
      `address` text NOT NULL,
      `city` varchar(100) NOT NULL,
      `pincode` varchar(10) NOT NULL,
      `total` decimal(10,2) NOT NULL,
      `status` varchar(20) DEFAULT 'Pending',
      `payment_method` varchar(50) NOT NULL,
      `payment_screenshot` longtext,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `order_items` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `order_id` varchar(50) NOT NULL,
      `product_id` varchar(50) NOT NULL,
      `name` varchar(255) NOT NULL,
      `quantity` int(11) NOT NULL,
      `price` decimal(10,2) NOT NULL,
      `selected_size` varchar(10) DEFAULT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS `abandoned_carts` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `phone` varchar(20) NOT NULL,
      `name` varchar(255),
      `cart_data` longtext NOT NULL,
      `status` varchar(20) DEFAULT 'abandoned',
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `unique_phone` (`phone`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";

    $conn->exec($sql);
    echo "<p style='color:green; font-weight:bold;'>[OK] DATABASE SCHEMA VERIFIED.</p>";
    
    // Insert initial admin settings if not exist
    $conn->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('qr_code_image', ''), ('royal_lion_branding', ''), ('shipping_price', '99')");
    
    echo "<p><b>MISSION COMPLETE.</b> Your shop is ready to dominate.</p>";
    echo "<a href='../' style='padding:15px 30px; background:black; color:white; text-decoration:none; display:inline-block; margin-top:20px; font-weight:bold; text-transform:uppercase; border:2px solid black;'>Back To Town Hub</a>";
} catch(PDOException $e) {
    echo "<p style='color:red; border:2px solid red; padding:20px;'><b>DATABASE ERROR:</b><br>" . $e->getMessage() . "</p>";
}
echo "</div></body></html>";
?>