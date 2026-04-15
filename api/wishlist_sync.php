<?php
require_once 'config.php';

$conn->exec("
CREATE TABLE IF NOT EXISTS `user_wishlists` (
  `user_id` int(11) NOT NULL,
  `wishlist_data` longtext NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['ids' => []]);
        exit;
    }

    $stmt = $conn->prepare("SELECT wishlist_data FROM user_wishlists WHERE user_id = :uid");
    $stmt->execute([':uid' => $user_id]);
    $result = $stmt->fetch();
    $raw = $result ? json_decode($result['wishlist_data'], true) : [];
    $ids = [];
    if (is_array($raw)) {
        foreach ($raw as $item) {
            if (is_string($item)) {
                $ids[] = $item;
            } elseif (is_array($item) && isset($item['id'])) {
                $ids[] = (string) $item['id'];
            }
        }
    }
    echo json_encode(['ids' => array_values(array_unique($ids))]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $ids = $data['ids'] ?? [];

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error']);
        exit;
    }

    if (!is_array($ids)) {
        $ids = [];
    }
    $clean = [];
    foreach ($ids as $id) {
        if (is_string($id) && $id !== '') {
            $clean[] = $id;
        } elseif (is_numeric($id)) {
            $clean[] = (string) $id;
        }
    }
    $clean = array_values(array_unique($clean));
    $json = json_encode($clean);

    $stmt = $conn->prepare("INSERT INTO user_wishlists (user_id, wishlist_data)
        VALUES (:uid, :data)
        ON DUPLICATE KEY UPDATE wishlist_data = :data2");
    $stmt->execute([
        ':uid' => $user_id,
        ':data' => $json,
        ':data2' => $json,
    ]);

    echo json_encode(['status' => 'synced']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'method_not_allowed']);
