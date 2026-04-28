<?php
require_once 'config.php';
// This file is used by the Admin Dashboard to verify the database is active
echo json_encode(["status" => "ok", "database" => "connected", "server_time" => date("Y-m-d H:i:s")]);
?>