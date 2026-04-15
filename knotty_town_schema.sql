-- KNOTTY TOWN | Hostinger Production Schema
-- This script will build all necessary tables and inject initial datasets.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+05:30";

-- --------------------------------------------------------

-- Table structure for `users`
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

-- Table structure for `user_carts`
CREATE TABLE IF NOT EXISTS `user_carts` (
  `user_id` int(11) NOT NULL,
  `cart_data` longtext NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `settings`
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `products`
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

-- Table structure for `orders`
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
  `shipping_price` decimal(10,2) DEFAULT '0.00',
  `status` varchar(20) DEFAULT 'Pending',
  `payment_method` varchar(50) NOT NULL,
  `payment_screenshot` longtext,
  `payment_id` varchar(100) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT 'Pending',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `order_items`
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `selected_size` varchar(10) DEFAULT NULL,
  `custom_design` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `abandoned_carts`
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

-- Table structure for `coupons`
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `is_used` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

-- INITIAL SEED DATA
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES 
('qr_code_image', ''), 
('royal_lion_branding', ''), 
('shipping_price', '99'),
('custom_design_price', '1599'),
('vault_passkey', 'TOWNLEGEND');

-- Inject placeholders as requested to ensure site is populated on first load
INSERT IGNORE INTO `products` (`id`, `name`, `price`, `original_price`, `category`, `description`, `image`, `back_image`, `rating`, `reviews`, `features`, `available_sizes`, `stock_quantity`, `is_sold_out`, `is_featured`) VALUES
('1', 'The Oversized Structure', 4200.00, NULL, 'Oversized Tees', 'Geometric oversized silhouette crafted from heavy gauge cotton.', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=1000', NULL, 4.8, '[]', '["300 GSM","Oversized Fit"]', '["S-10","M-10","L-10","XL-10"]', 100, 0, 1),
('2', 'Monolith Trouser', 5800.00, NULL, 'Minimalist', 'Architecture for the legs. Sculpted drape in wool blend.', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1000', NULL, 4.9, '[]', '["Wool Blend","Elastic Waist"]', '["30-10","32-10","34-10"]', 100, 0, 1),
('3', 'Ghost Layer Shell', 7200.00, NULL, 'Graphic Collection', 'A translucent study in technical silk. Minimalist weather protection.', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1000', NULL, 4.7, '[]', '["Technical Silk","Water Resistant"]', '["M-5","L-5"]', 100, 0, 1),
('4', 'Observer T-Shirt', 2900.00, NULL, 'Oversized Tees', 'The foundation of the modern wardrobe. 300gsm raw cotton.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000', NULL, 4.8, '[]', '["Raw Cotton","Minimalist"]', '["S-10","M-10","L-10","XL-10"]', 100, 0, 1),
('m1', 'The Geometric Monolith', 3500.00, NULL, 'Metal Posters', 'Brushed aluminum panel featuring architectural geometric studies.', 'https://images.unsplash.com/photo-1618609516629-3b6038148b59?auto=format&fit=crop&q=80&w=1000', NULL, 4.9, '[]', '["Brushed Aluminum","Hidden Mount"]', '[]', 100, 0, 1),
('m2', 'Desert Mirage Panel', 3800.00, NULL, 'Metal Posters', 'Subtle metallic print capturing light anomalies in high desert.', 'https://images.unsplash.com/photo-1518005020410-09880ef2016f?auto=format&fit=crop&q=80&w=1000', NULL, 4.8, '[]', '["Matte Finish","Gallery Box"]', '[]', 100, 0, 1);

COMMIT;
