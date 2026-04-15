<?php
/**
 * Plugin Name: KNOTTY TOWN - Streetwear Portal
 * Description: High-performance React shop. Use shortcode [knotty_town_shop]
 * Version: 2.1.0
 * Author: Knotty Town
 */

if (!defined('ABSPATH')) exit;

add_shortcode('knotty_town_shop', function() {
    $url = plugin_dir_url(__FILE__);
    $path = plugin_dir_path(__FILE__);
    
    // Scan for assets
    $assets_dir = $path . 'dist/assets/';
    $js_file = '';
    $css_file = '';

    if (is_dir($assets_dir)) {
        $files = scandir($assets_dir);
        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'js' && strpos($file, 'index') !== false) {
                $js_file = 'dist/assets/' . $file;
            }
            if (pathinfo($file, PATHINFO_EXTENSION) === 'css' && strpos($file, 'index') !== false) {
                $css_file = 'dist/assets/' . $file;
            }
        }
    }

    ob_start();
    ?>
    <div id="root"></div>
    
    <!-- Load CSS -->
    <?php if ($css_file): ?>
        <link rel="stylesheet" href="<?php echo $url . $css_file; ?>">
    <?php endif; ?>

    <!-- Load JS Module -->
    <?php if ($js_file): ?>
        <script type="module" src="<?php echo $url . $js_file; ?>"></script>
    <?php endif; ?>

    <!-- Tailwind CDN for dynamic classes not purged -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&family=Bungee&display=swap" rel="stylesheet">
    
    <style>
        #root { all: unset; display: block; min-height: 600px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-funky { font-family: 'Bungee', cursive; }
    </style>
    <?php
    return ob_get_clean();
});