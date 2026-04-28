<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $productId = $data['productId'] ?? null;
    $userName = $data['userName'] ?? 'Anonymous';
    $rating = (int)($data['rating'] ?? 5);
    $comment = $data['comment'] ?? '';
    $photoData = $data['photoData'] ?? null; // Expecting base64 if it's a new photo

    if (!$productId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID is required"]);
        exit();
    }

    try {
        // Fetch current reviews
        $stmt = $conn->prepare("SELECT reviews FROM products WHERE id = :id");
        $stmt->execute([':id' => $productId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Product not found"]);
            exit();
        }

        $reviews = json_decode($row['reviews'] ?? '[]', true);
        if (!is_array($reviews)) $reviews = [];

        // Save image if present (very simplified base64 storage for this prototype)
        // In production, you'd save to a file system and return the URL
        $photoUrl = $photoData; 

        $newReview = [
            "id" => uniqid(),
            "userName" => $userName,
            "rating" => $rating,
            "comment" => $comment,
            "date" => date('Y-m-d\TH:i:s\Z'),
            "photoUrl" => $photoUrl
        ];

        array_unshift($reviews, $newReview);
        $updatedReviews = json_encode($reviews);

        // Update product reviews and recalculate average rating (simple average)
        $totalRating = 0;
        foreach ($reviews as $r) {
            $totalRating += (int)$r['rating'];
        }
        $avgRating = count($reviews) > 0 ? $totalRating / count($reviews) : 5.0;

        $updateStmt = $conn->prepare("UPDATE products SET reviews = :reviews, rating = :rating WHERE id = :id");
        $updateStmt->execute([
            ':reviews' => $updatedReviews,
            ':rating' => $avgRating,
            ':id' => $productId
        ]);

        echo json_encode(["status" => "success", "review" => $newReview, "newRating" => $avgRating]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
