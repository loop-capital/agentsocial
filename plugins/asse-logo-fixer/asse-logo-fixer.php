<?php
/**
 * Plugin Name: ASSE Logo Fixer
 * Description: One-time fix to restore proper logo settings in hcode_theme_setting. Self-deactivates after running.
 * Version: 1.0.0
 * Author: AgentSocial
 */

register_activation_hook(__FILE__, 'asse_logo_fixer_activate');

function asse_logo_fixer_activate() {
    $option = get_option('hcode_theme_setting');
    if (!is_array($option)) {
        return;
    }
    
    // Logo data: proper Redux Framework arrays with url, id, height, width
    $logos = array(
        'hcode_header_logo' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_header_logo_general' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo_general' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_header_logo_woocommerce' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo_woocommerce' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_general' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light_general' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_woocommerce' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light_woocommerce' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_menu_logo' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_menu_logo_general' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_menu_logo_woocommerce' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_footer_logo' => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/footer-logo.png.webp', 'id' => '2733', 'height' => '126', 'width' => '201'),
    );
    
    $changed = 0;
    foreach ($logos as $key => $data) {
        if (isset($option[$key])) {
            $current = $option[$key];
            // Fix broken string values like "[5]", "[2465]", "[4]", etc.
            if (is_string($current) && preg_match('/^\[\d+\]$/', $current)) {
                $option[$key] = $data;
                $changed++;
            }
        }
    }
    
    if ($changed > 0) {
        update_option('hcode_theme_setting', $option);
    }
    
    // Clean up separate options that were created by mistake
    $separate = array('hcode_header_logo', 'hcode_header_light_logo', 'hcode_header_logo_general', 'hcode_header_light_logo_general', 'hcode_header_logo_woocommerce', 'hcode_header_light_logo_woocommerce', 'hcode_retina_logo', 'hcode_retina_logo_light', 'hcode_retina_logo_general', 'hcode_retina_logo_light_general', 'hcode_retina_logo_woocommerce', 'hcode_retina_logo_light_woocommerce', 'hcode_menu_logo', 'hcode_menu_logo_general', 'hcode_menu_logo_woocommerce', 'hcode_footer_logo');
    foreach ($separate as $opt) {
        delete_option($opt);
    }
    
    // Reset compiler cache to force CSS regeneration
    update_option('last_compiler', 0);
    
    // Self-deactivate after running
    deactivate_plugins(plugin_basename(__FILE__));
}