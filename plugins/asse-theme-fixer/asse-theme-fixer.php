<?php
/**
 * Plugin Name: ASSE Theme Fixer
 * Description: Fixes H-Code theme logo settings (one-time fix on activation), special product section, product picker, newsletter centering, REST API for theme options, and schema injection.
 * Version: 2.1.0
 * Author: AgentSocial
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Text Domain: asse-theme-fixer
 */

if (!defined('ABSPATH')) exit;

// ═══════════════════════════════════════════════════════════════
//  ONE-TIME LOGO FIX (runs on activation, fixes broken [5] strings)
// ═══════════════════════════════════════════════════════════════

register_activation_hook(__FILE__, 'asse_fix_broken_logos');

function asse_fix_broken_logos() {
    $option = get_option('hcode_theme_setting');
    if (!is_array($option)) return;

    $logos = array(
        'hcode_header_logo'                 => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo'           => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_header_logo_general'         => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo_general'    => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_header_logo_woocommerce'     => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_header_light_logo_woocommerce'=> array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo'                 => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light'           => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_general'         => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light_general'   => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_woocommerce'     => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Retina.png', 'id' => '2466', 'height' => '35', 'width' => '109'),
        'hcode_retina_logo_light_woocommerce'=> array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo_Wht.png', 'id' => '2578', 'height' => '35', 'width' => '109'),
        'hcode_menu_logo'                   => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_menu_logo_general'           => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_menu_logo_woocommerce'      => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/UpLook_Logo.png', 'id' => '2465', 'height' => '80', 'width' => '250'),
        'hcode_footer_logo'                 => array('url' => 'https://wp.getuplook.com/wp-content/uploads/2026/05/footer-logo.png.webp', 'id' => '2733', 'height' => '126', 'width' => '201'),
    );

    $changed = 0;
    foreach ($logos as $key => $data) {
        if (isset($option[$key])) {
            $current = $option[$key];
            if (is_string($current) && preg_match('/^\[\d+\]$/', $current)) {
                $option[$key] = $data;
                $changed++;
            }
        }
    }
    if ($changed > 0) {
        update_option('hcode_theme_setting', $option);
    }

    // Clean up orphaned separate options
    foreach (array('hcode_header_logo','hcode_header_light_logo','hcode_header_logo_general','hcode_header_light_logo_general','hcode_header_logo_woocommerce','hcode_header_light_logo_woocommerce','hcode_retina_logo','hcode_retina_logo_light','hcode_retina_logo_general','hcode_retina_logo_light_general','hcode_retina_logo_woocommerce','hcode_retina_logo_light_woocommerce','hcode_menu_logo','hcode_menu_logo_general','hcode_menu_logo_woocommerce','hcode_footer_logo') as $opt) {
        delete_option($opt);
    }

    // Reset compiler cache
    update_option('last_compiler', 0);
}

// ═══════════════════════════════════════════════════════════════
//  FRONTEND CSS FIXES
// ═══════════════════════════════════════════════════════════════

add_action('wp_head', function() {
    if (!class_exists('WooCommerce')) return;
    ?>
    <style id="asse-newsletter-center">
    /* Center the newsletter email input and sign-up button */
    .shop-newsletter .mc4wp-form-fields {
        text-align: center;
    }
    .shop-newsletter .mc4wp-form-fields p {
        text-align: center;
    }
    .shop-newsletter .mc4wp-form input[type="email"] {
        display: block !important;
        margin: 0 auto !important;
        text-align: center;
        max-width: 320px;
        width: 100%;
    }
    .shop-newsletter .mc4wp-form input[type="submit"],
    .shop-newsletter .mc4wp-form button[type="submit"] {
        display: block !important;
        margin: 8px auto 0 !important;
        text-align: center;
    }
    .shop-newsletter .mc4wp-form .mc4wp-form-fields {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 12px !important;
        flex-wrap: wrap !important;
    }
    .shop-newsletter .mc4wp-form .mc4wp-form-fields p {
        margin: 0 !important;
    }
    .shop-newsletter .mc4wp-form .mc4wp-form-fields input[type="email"] {
        text-align: center !important;
        min-width: 220px !important;
    }
    </style>
    <?php
});

// ═══════════════════════════════════════════════════════════════
//  PRODUCT PICKER - Override hcode_shop_top_five Shortcode
// ═══════════════════════════════════════════════════════════════

// Remove original shortcode and add our own
add_action('init', function() {
    remove_shortcode('hcode_shop_top_five');
    add_shortcode('hcode_shop_top_five', 'asse_product_picker_shortcode');
}, 20);

function asse_product_picker_shortcode($atts) {
    // Get saved product selections
    $left_ids   = get_option('asse_left_product_ids', []);
    $center_ids = get_option('asse_center_product_ids', []);
    $right_ids  = get_option('asse_right_product_ids', []);

    // Fallback to on-sale products if no products are set
    $left_product   = asse_get_product($left_ids, 'left');
    $center_product = asse_get_product($center_ids, 'center');
    $right_product  = asse_get_product($right_ids, 'right');

    if (!$left_product && !$center_product && !$right_product) {
        return ''; // Nothing to show
    }

    ob_start();
    ?>
    <section class="no-padding" style="background-color:#252525;">
        <div class="container-fluid">
            <div class="row">
                <?php if ($left_product): ?>
                <div class="wpb_column hcode-column-container no-padding vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="no-padding col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <?php echo asse_render_product_card($left_product); ?>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($center_product): ?>
                <div class="wpb_column hcode-column-container text-center vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="text-center col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <div class="shop-newsletter-main">
                            <div class="shop-newsletter">
                                <?php echo asse_render_product_card_center($center_product); ?>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <?php if ($right_product): ?>
                <div class="wpb_column hcode-column-container no-padding vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="no-padding col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <?php echo asse_render_product_card($right_product); ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}

function asse_get_product($ids, $position) {
    // If specific products are set, use them
    if (!empty($ids) && is_array($ids)) {
        foreach ($ids as $id) {
            $product = wc_get_product($id);
            if ($product && $product->is_visible()) return $product;
        }
    }
    // Fallback: get a random on-sale product
    $sale_products = wc_get_product_ids_on_sale();
    if (!empty($sale_products)) {
        shuffle($sale_products);
        foreach ($sale_products as $id) {
            $product = wc_get_product($id);
            if ($product && $product->is_visible()) return $product;
        }
    }
    return null;
}

function asse_render_product_card($product) {
    $image = wp_get_attachment_image_url($product->get_image_id(), 'full');
    $link  = $product->get_permalink();
    ob_start();
    ?>
    <a href="<?php echo esc_url($link); ?>">
        <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($product->get_name()); ?>" />
    </a>
    <?php
    return ob_get_clean();
}

function asse_render_product_card_center($product) {
    ob_start();
    ?>
    <div class="product-display text-center" style="padding: 20px 0;">
        <a href="<?php echo esc_url($product->get_permalink()); ?>">
            <?php echo $product->get_image('woocommerce_thumbnail'); ?>
        </a>
        <div style="padding: 12px 0;">
            <span class="product-name text-uppercase letter-spacing-2" style="color:#ababab; font-size:13px;">
                <a href="<?php echo esc_url($product->get_permalink()); ?>"><?php echo esc_html($product->get_name()); ?></a>
            </span>
            <span class="price product-price-box black-text" style="display:block; color:#fff;"><?php echo $product->get_price_html(); ?></span>
            <div class="quick-buy">
                <div class="product-share">
                    <a href="<?php echo esc_url($product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_<?php echo $product->get_type(); ?>" data-product_id="<?php echo $product->get_id(); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Select options for <?php echo esc_attr($product->get_name()); ?>" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN - Product Picker Settings Page
// ═══════════════════════════════════════════════════════════════

add_action('admin_menu', function() {
    add_submenu_page(
        'woocommerce',
        'Special Products',
        'Special Products',
        'manage_woocommerce',
        'asse-special-products',
        'asse_product_picker_page'
    );
});

function asse_product_picker_page() {
    if (!current_user_can('manage_woocommerce')) return;
    ?>
    <div class="wrap">
        <h1>Special Product Section</h1>
        <p>Select which products appear in the 3-column special product section on the homepage.</p>
        <form method="post" action="options.php">
            <?php settings_fields('asse_product_picker'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Left Column Product</th>
                    <td>
                        <input type="text" name="asse_left_product_ids" value="<?php echo esc_attr(implode(',', get_option('asse_left_product_ids', []))); ?>" class="regular-text" placeholder="Product IDs (comma-separated)" />
                        <button type="button" class="button asse-search-btn" data-target="asse_left_product_ids">Search Products</button>
                        <div class="asse-preview" id="asse_left_preview"></div>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Center Column Product</th>
                    <td>
                        <input type="text" name="asse_center_product_ids" value="<?php echo esc_attr(implode(',', get_option('asse_center_product_ids', []))); ?>" class="regular-text" placeholder="Product IDs (comma-separated)" />
                        <button type="button" class="button asse-search-btn" data-target="asse_center_product_ids">Search Products</button>
                        <div class="asse-preview" id="asse_center_preview"></div>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Right Column Product</th>
                    <td>
                        <input type="text" name="asse_right_product_ids" value="<?php echo esc_attr(implode(',', get_option('asse_right_product_ids', []))); ?>" class="regular-text" placeholder="Product IDs (comma-separated)" />
                        <button type="button" class="button asse-search-btn" data-target="asse_right_product_ids">Search Products</button>
                        <div class="asse-preview" id="asse_right_preview"></div>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <style>
        .asse-preview { margin-top: 8px; }
        .asse-preview img { max-width: 80px; border: 1px solid #ddd; border-radius: 4px; }
        .asse-modal { display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border:1px solid #ccc; padding:20px; z-index:100000; width:600px; max-height:80vh; overflow-y:auto; box-shadow: 0 5px 15px rgba(0,0,0,.5); }
        .asse-modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,.5); z-index:99999; }
        .asse-modal input[type=search] { width:100%; padding:8px; margin-bottom:12px; }
        .asse-modal .product-item { display:flex; align-items:center; padding:8px; border-bottom:1px solid #eee; cursor:pointer; }
        .asse-modal .product-item:hover { background:#f0f0f0; }
        .asse-modal .product-item img { width:50px; margin-right:12px; }
    </style>
    <div class="asse-modal-overlay" id="asse-modal-overlay"></div>
    <div class="asse-modal" id="asse-modal">
        <h3>Search Products</h3>
        <input type="search" id="asse-product-search" placeholder="Search by name..." />
        <div id="asse-search-results"></div>
    </div>
    <script>
    jQuery(function($) {
        var currentTarget = '';
        $('.asse-search-btn').on('click', function() {
            currentTarget = $(this).data('target');
            $('#asse-modal, #asse-modal-overlay').show();
            $('#asse-product-search').val('').focus().trigger('input');
        });
        $('#asse-modal-overlay').on('click', function() {
            $('#asse-modal, #asse-modal-overlay').hide();
        });
        var searchTimer;
        $('#asse-product-search').on('input', function() {
            clearTimeout(searchTimer);
            var q = $(this).val();
            searchTimer = setTimeout(function() {
                $.get('<?php echo admin_url("admin-ajax.php"); ?>', {
                    action: 'asse_search_products',
                    nonce: '<?php echo wp_create_nonce("asse_admin_nonce"); ?>',
                    q: q
                }, function(data) {
                    $('#asse-search-results').html(data);
                });
            }, 300);
        });
        $(document).on('click', '.asse-product-item', function() {
            var id = $(this).data('id');
            var name = $(this).data('name');
            $('input[name="' + currentTarget + '"]').val(id);
            $('#asse-modal, #asse-modal-overlay').hide();
        });
    });
    </script>
    <?php
}

// Register settings
add_action('admin_init', function() {
    register_setting('asse_product_picker', 'asse_left_product_ids', ['type' => 'array', 'sanitize_callback' => 'asse_sanitize_product_ids']);
    register_setting('asse_product_picker', 'asse_center_product_ids', ['type' => 'array', 'sanitize_callback' => 'asse_sanitize_product_ids']);
    register_setting('asse_product_picker', 'asse_right_product_ids', ['type' => 'array', 'sanitize_callback' => 'asse_sanitize_product_ids']);
});

function asse_sanitize_product_ids($value) {
    if (is_string($value)) {
        $ids = array_map('intval', explode(',', $value));
        return array_filter($ids);
    }
    return is_array($value) ? array_map('intval', $value) : [];
}

// AJAX search products
add_action('wp_ajax_asse_search_products', function() {
    check_ajax_referer('asse_admin_nonce', 'nonce');
    $q = sanitize_text_field($_GET['q'] ?? '');
    $products = wc_get_products([
        'status' => 'publish',
        'limit' => 20,
        's' => $q,
    ]);
    if (empty($products)) {
        echo '<p>No products found.</p>';
    }
    foreach ($products as $p) {
        echo '<div class="asse-product-item product-item" data-id="' . $p->get_id() . '" data-name="' . esc_attr($p->get_name()) . '">';
        echo $p->get_image('thumbnail');
        echo '<div><strong>' . esc_html($p->get_name()) . '</strong><br><small>$' . $p->get_price() . ' (ID: ' . $p->get_id() . ')</small></div>';
        echo '</div>';
    }
    wp_die();
});

// AJAX get product names
add_action('wp_ajax_asse_get_product_names', function() {
    check_ajax_referer('asse_admin_nonce', 'nonce');
    $ids = array_map('intval', $_GET['ids'] ?? []);
    $names = [];
    foreach ($ids as $id) {
        $p = wc_get_product($id);
        if ($p) $names[$id] = $p->get_name();
    }
    wp_send_json($names);
});

// ═══════════════════════════════════════════════════════════════
//  REST API - Theme Options Endpoints
// ═══════════════════════════════════════════════════════════════

add_action('rest_api_init', function() {
    register_rest_route('asse/v1', '/theme-options', [
        'methods' => 'GET',
        'callback' => 'asse_get_theme_options',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ]);
    register_rest_route('asse/v1', '/theme-options', [
        'methods' => 'POST',
        'callback' => 'asse_set_theme_options',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ]);
    register_rest_route('asse/v1', '/theme-options/search', [
        'methods' => 'GET',
        'callback' => 'asse_search_theme_options',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ]);
});

function asse_get_theme_options(WP_REST_Request $request) {
    $settings = get_option('hcode_theme_setting', []);
    $theme_mods = get_option('theme_mods_h-code', []);
    return new WP_REST_Response([
        'hcode_theme_setting' => $settings,
        'theme_mods_h-code' => $theme_mods,
    ], 200);
}

function asse_set_theme_options(WP_REST_Request $request) {
    $key = $request->get_param('key');
    $value = $request->get_param('value');
    
    if (empty($key)) {
        return new WP_Error('missing_key', 'Option key is required', ['status' => 400]);
    }
    
    // Handle hcode_theme_setting specially - update nested values
    if ($key === 'hcode_theme_setting' && is_array($value)) {
        $existing = get_option('hcode_theme_setting', []);
        if (!is_array($existing)) $existing = [];
        $merged = array_merge($existing, $value);
        update_option('hcode_theme_setting', $merged);
        $verified = get_option('hcode_theme_setting', []);
        return new WP_REST_Response([
            'status' => 'updated',
            'key' => $key,
            'type' => 'option',
            'verified' => $verified,
        ], 200);
    }
    
    // Regular option update
    update_option($key, $value);
    $verified = get_option($key, $value);
    
    return new WP_REST_Response([
        'status' => 'updated',
        'key' => $key,
        'type' => 'option',
        'verified' => is_string($verified) ? $verified : json_encode($verified),
    ], 200);
}

function asse_search_theme_options(WP_REST_Request $request) {
    $q = $request->get_param('q') ?? '';
    $settings = get_option('hcode_theme_setting', []);
    $results = [];
    $q_lower = strtolower($q);
    foreach ($settings as $key => $value) {
        if (empty($q) || str_contains(strtolower($key), $q_lower)) {
            $results[$key] = is_string($value) ? $value : json_encode($value);
        }
    }
    return new WP_REST_Response($results, 200);
}
