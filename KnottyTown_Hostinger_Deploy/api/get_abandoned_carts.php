
<?php
require_once 'config.php';

header('Content-Type: application/json');
require_admin();

try {
    $stmt = $conn->query("SELECT * FROM abandoned_carts ORDER BY updated_at DESC");
    $carts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($carts);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
