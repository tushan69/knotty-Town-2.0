<?php
/**
 * SECURE SETUP SCRIPT FOR RAZORPAY CREDENTIALS
 * Authorize with your admin token, configure keys via form, then DELETE this file.
 */

require_once 'config.php';

$pdo = $conn;
$message = '';
$message_type = 'info';

// Check authorization
$admin_token = $_POST['admin_token'] ?? $_GET['admin_token'] ?? '';
$is_authorized = false;

if ($admin_token !== '' && hash_equals(knotty_expected_admin_token(), $admin_token)) {
    $is_authorized = true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $is_authorized) {
    $key_id = trim($_POST['razorpay_key_id'] ?? '');
    $key_secret = trim($_POST['razorpay_key_secret'] ?? '');
    $webhook_secret = trim($_POST['razorpay_webhook_secret'] ?? '');

    if (empty($key_id) || empty($key_secret)) {
        $message = 'Error: Key ID and Key Secret cannot be empty.';
        $message_type = 'error';
    } else {
        try {
            $pdo->beginTransaction();

            // Store in DB Settings table
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('razorpay_key', :val) ON DUPLICATE KEY UPDATE setting_value = :val");
            $stmt->execute([':val' => $key_id]);

            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('razorpay_secret', :val) ON DUPLICATE KEY UPDATE setting_value = :val");
            $stmt->execute([':val' => $key_secret]);

            if (!empty($webhook_secret)) {
                $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('razorpay_webhook_secret', :val) ON DUPLICATE KEY UPDATE setting_value = :val");
                $stmt->execute([':val' => $webhook_secret]);
            }

            $pdo->commit();
            $message = 'Success: Database settings updated successfully!';
            $message_type = 'success';

            // Attempt to write to secure_env.php if writable
            $secure_env_path = __DIR__ . '/secure_env.php';
            if (is_writable($secure_env_path) || !file_exists($secure_env_path)) {
                $env_content = "<?php\n"
                    . "/**\n"
                    . " * KNOTTY TOWN - Production Credentials (GIT IGNORED)\n"
                    . " * Do not commit this file to Git.\n"
                    . " */\n\n"
                    . "// Hostinger Database Production Credentials\n"
                    . "define('SECURE_DB_HOST', '" . addslashes(defined('SECURE_DB_HOST') ? SECURE_DB_HOST : 'localhost') . "');\n"
                    . "define('SECURE_DB_NAME', '" . addslashes(defined('SECURE_DB_NAME') ? SECURE_DB_NAME : 'knotty_town_prod') . "');\n"
                    . "define('SECURE_DB_USER', '" . addslashes(defined('SECURE_DB_USER') ? SECURE_DB_USER : 'root') . "');\n"
                    . "define('SECURE_DB_PASS', '" . addslashes(defined('SECURE_DB_PASS') ? SECURE_DB_PASS : '') . "');\n\n"
                    . "// Razorpay Payment Gateway Credentials\n"
                    . "define('SECURE_RAZORPAY_KEY_ID', '" . addslashes($key_id) . "');\n"
                    . "define('SECURE_RAZORPAY_KEY_SECRET', '" . addslashes($key_secret) . "');\n";
                
                if (!empty($webhook_secret)) {
                    $env_content .= "define('SECURE_RAZORPAY_WEBHOOK_SECRET', '" . addslashes($webhook_secret) . "');\n";
                }
                
                $env_content .= "\n// Google Gemini API Configuration (loaded on demand)\n"
                    . "\$env_gemini = getenv('GEMINI_API_KEY') ?: getenv('VITE_GEMINI_API_KEY');\n"
                    . "define('SECURE_GEMINI_API_KEY', \$env_gemini ?: '');\n"
                    . "?>\n";

                if (file_put_contents($secure_env_path, $env_content) !== false) {
                    $message .= ' Also successfully updated ' . basename($secure_env_path) . '!';
                }
            }

        } catch (Exception $e) {
            $pdo->rollBack();
            $message = 'Error: Failed to save credentials. ' . $e->getMessage();
            $message_type = 'error';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Razorpay Secure Configuration | Knotty Town</title>
    <style>
        :root {
            --bg-color: #FAF9F6;
            --card-bg: #ffffff;
            --text-primary: #111111;
            --text-secondary: #767676;
            --accent: #745b3b;
            --accent-hover: #5c482f;
            --border: #e4e4e7;
            --success: #16a34a;
            --error: #dc2626;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 480px;
            padding: 40px 24px;
        }

        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            border-radius: 4px;
        }

        h1 {
            font-family: Georgia, serif;
            font-size: 24px;
            font-weight: normal;
            margin-top: 0;
            margin-bottom: 8px;
            text-align: center;
        }

        .subtitle {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: var(--text-secondary);
            text-align: center;
            margin-bottom: 32px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-secondary);
        }

        input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border);
            background-color: transparent;
            box-sizing: border-box;
            font-size: 14px;
            color: var(--text-primary);
            transition: border-color 0.2s;
            border-radius: 2px;
        }

        input:focus {
            outline: none;
            border-color: var(--text-primary);
        }

        button {
            width: 100%;
            padding: 14px;
            background-color: var(--text-primary);
            color: #ffffff;
            border: none;
            cursor: pointer;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            font-weight: 600;
            transition: background-color 0.2s;
            margin-top: 12px;
            border-radius: 2px;
        }

        button:hover {
            background-color: #333333;
        }

        .alert {
            padding: 12px 16px;
            font-size: 13px;
            margin-bottom: 24px;
            border-radius: 2px;
            line-height: 1.5;
        }

        .alert-success {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: var(--success);
        }

        .alert-error {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: var(--error);
        }

        .alert-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #475569;
        }

        .warning-box {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            color: #b45309;
            padding: 16px;
            font-size: 12px;
            border-radius: 2px;
            margin-top: 24px;
            line-height: 1.6;
        }

        .warning-title {
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Knotty Town</h1>
            <div class="subtitle">Razorpay Setup Utility</div>

            <?php if (!empty($message)): ?>
                <div class="alert alert-<?php echo $message_type; ?>">
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>

            <?php if (!$is_authorized): ?>
                <form method="GET" action="">
                    <div class="form-group">
                        <label for="admin_token">Admin Access Token</label>
                        <input type="password" name="admin_token" id="admin_token" placeholder="Enter X-Admin-Token to authorize" required autocomplete="off">
                    </div>
                    <button type="submit">Authorize Utility</button>
                </form>
            <?php else: ?>
                <form method="POST" action="">
                    <input type="hidden" name="admin_token" value="<?php echo htmlspecialchars($admin_token); ?>">
                    
                    <div class="form-group">
                        <label for="razorpay_key_id">Razorpay Key ID</label>
                        <input type="text" name="razorpay_key_id" id="razorpay_key_id" placeholder="rzp_live_..." required autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label for="razorpay_key_secret">Razorpay Key Secret</label>
                        <input type="password" name="razorpay_key_secret" id="razorpay_key_secret" placeholder="Enter key secret" required autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label for="razorpay_webhook_secret">Razorpay Webhook Secret</label>
                        <input type="password" name="razorpay_webhook_secret" id="razorpay_webhook_secret" placeholder="Enter webhook secret (Optional)" autocomplete="off">
                    </div>

                    <button type="submit">Save Configuration</button>
                </form>

                <div class="warning-box">
                    <div class="warning-title">⚠️ CRITICAL SECURITY WARNING</div>
                    After completing the setup successfully, you MUST delete this file (<code>api/setup_razorpay.php</code>) from the production server immediately. Leaving this file online exposes a potential vector for configuration modifications.
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
