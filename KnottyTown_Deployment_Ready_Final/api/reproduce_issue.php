<?php
$url = 'http://localhost:5173/api/orders.php'; // Adjust if running on different port/host

$data = [
    'id' => 'KT-TEST-COD-' . time(),
    'customer' => [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '1234567890',
        'address' => '123 Test St',
        'city' => 'Test City',
        'pincode' => '123456'
    ],
    'total' => 1000,
    'shipping_price' => 0,
    'paymentMethod' => 'Cash on Delivery',
    'paymentScreenshot' => null,
    'items' => [
        [
            'id' => 'prod_1',
            'name' => 'Test Product',
            'quantity' => 1,
            'price' => 1000,
            'selectedSize' => 'M',
            'isCustom' => false
        ]
    ]
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true // To fetch content even on 500 error
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "Response Headers:\n";
print_r($http_response_header);
echo "\nResponse Body:\n";
echo $result;
?>
