<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $mode = $data['mode'] ?? 'google'; // 'google', 'login', 'register'

    try {
        if ($mode === 'google') {
            if (!isset($data['google_id']) || !isset($data['email'])) {
                throw new Exception("Incomplete Google credentials");
            }
            // Upsert User
            $stmt = $conn->prepare("INSERT INTO users (google_id, name, email, picture) 
                                   VALUES (:gid, :name, :email, :pic) 
                                   ON DUPLICATE KEY UPDATE name=:name, picture=:pic, google_id=:gid");
            
            $stmt->execute([
                ':gid' => $data['google_id'],
                ':name' => $data['name'],
                ':email' => $data['email'],
                ':pic' => $data['picture'] ?? null
            ]);

            $stmt = $conn->prepare("SELECT id, google_id, name, email, picture, is_admin FROM users WHERE email = :email");
            $stmt->execute([':email' => $data['email']]);
            $user = $stmt->fetch();
            
            if ($user && (int)($user['is_admin'] ?? 0) === 1) {
                $_SESSION['is_admin'] = true;
            }
            
            echo json_encode($user);
        } 
        else if ($mode === 'register') {
            $email = $data['email'];
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $name = $data['name'] ?? explode('@', $email)[0];

            $stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (:name, :email, :pass)");
            $stmt->execute([':name' => $name, ':email' => $email, ':pass' => $password]);
            
            $stmt = $conn->prepare("SELECT id, name, email, picture FROM users WHERE email = :email");
            $stmt->execute([':email' => $email]);
            echo json_encode($stmt->fetch());
        } 
        else if ($mode === 'admin_login') {
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            
            // Hardcoded for now consistent with frontend, but on backend for session control
            if (strtoupper($username) === 'KK' && $password === '382094808321') {
                $_SESSION['is_admin'] = true;
                echo json_encode(["status" => "success", "user" => "ADMIN", "token" => "KNOTTY_ADMIN_SECRET_2026"]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Invalid admin credentials"]);
            }
        }
        else if ($mode === 'login') {
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->execute([':email' => $data['email']]);
            $user = $stmt->fetch();

            if ($user && password_verify($data['password'], $user['password'])) {
                unset($user['password']);
                // Check if this user has admin rights via DB column
                if ((int)($user['is_admin'] ?? 0) === 1) {
                    $_SESSION['is_admin'] = true;
                }
                echo json_encode($user);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Invalid email or password"]);
            }
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
