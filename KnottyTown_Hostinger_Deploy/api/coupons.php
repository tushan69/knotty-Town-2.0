<?php
require_once 'config.php';

// Ensure table exists
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS `coupons` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `code` varchar(50) NOT NULL UNIQUE,
      `discount_amount` decimal(10,2) NOT NULL,
      `is_used` tinyint(1) DEFAULT 0,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      `used_at` datetime DEFAULT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch(Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($action === 'validate') {
        $code = trim($data['code'] ?? '');
        if (!$code) {
             echo json_encode(["valid" => false, "message" => "Code required"]);
             exit;
        }
        $stmt = $conn->prepare("SELECT * FROM coupons WHERE code = :code");
        $stmt->execute([':code' => $code]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$coupon) {
            echo json_encode(["valid" => false, "message" => "Invalid coupon code"]);
        } else if ($coupon['is_used'] == 1) {
            echo json_encode(["valid" => false, "message" => "Coupon already used"]);
        } else {
            echo json_encode(["valid" => true, "amount" => (float)$coupon['discount_amount']]);
        }
        exit;
    }
    
    // Admin Actions require auth
    require_admin();
    if ($action === 'create') {
        $amount = (float)($data['amount'] ?? 0);
        $count = (int)($data['count'] ?? 1);
        
        if ($amount <= 0 || $count <= 0) {
            echo json_encode(["error" => "Invalid amount or count"]);
            exit;
        }
        
        $codes = [];
        $errors = [];
        try {
            $stmt = $conn->prepare("INSERT INTO coupons (code, discount_amount) VALUES (:code, :amount)");
            for ($i = 0; $i < $count; $i++) {
                $codeStr = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8)); // Generate random 8-char code
                try {
                    $stmt->execute([':code' => $codeStr, ':amount' => $amount]);
                    $codes[] = $codeStr;
                } catch (Exception $e) { 
                    $errors[] = "DB Write Error: " . $e->getMessage();
                    $i--; // retry if unique constraint fails
                    if(count($errors) > 5) break; // prevent infinite loop
                } 
            }
        } catch (Exception $e) {
            $errors[] = "Prepare Failed: " . $e->getMessage();
            // attempt automated table repair
            try {
                 $conn->exec("CREATE TABLE IF NOT EXISTS coupons (id int(11) NOT NULL AUTO_INCREMENT, code varchar(50) NOT NULL UNIQUE, discount_amount decimal(10,2) NOT NULL, is_used tinyint(1) DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, used_at datetime DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
                 $errors[] = "Table repaired, try minting again.";
            } catch(Exception $repairErr) {
                 $errors[] = "Repair Failed: " . $repairErr->getMessage();
            }
        }
        
        if (count($codes) > 0) {
            echo json_encode(["status" => "success", "codes" => $codes, "errors" => $errors]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Zero coupons yielded.", "errors" => $errors]);
        }
        exit;
    }
}

if ($method === 'GET') {
    require_admin();
    $stmt = $conn->query("SELECT * FROM coupons ORDER BY created_at DESC");
    $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["coupons" => $coupons]);
    exit;
}

if ($method === 'DELETE') {
    require_admin();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $stmt = $conn->prepare("DELETE FROM coupons WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(["status" => "deleted"]);
    exit;
}
