
<?php
try {
    $conn = new PDO("mysql:host=localhost", "root", "");
    $stmt = $conn->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($databases);
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
