<?php
/**
 * Plugin Name: ASSE Theme Fixer
 * Description: Fixes H-Code theme special product section (5 products: 2 left, 1 center, 2 right), product picker, newsletter centering, REST API for theme options.
 * Version: 2.2.0
 * Author: AgentSocial
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Text Domain: asse-theme-fixer
 */

if (!defined('ABSPATH')) exit;

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
//  Layout: Left (upper + lower) | Center (product + newsletter) | Right (upper + lower)
// ═══════════════════════════════════════════════════════════════

add_action('init', function() {
    remove_shortcode('hcode_shop_top_five');
    add_shortcode('hcode_shop_top_five', 'asse_product_picker_shortcode');
}, 20);

function asse_parse_product_ids($raw) {
    if (is_array($raw)) return array_filter(array_map('intval', $raw));
    if (empty($raw)) return [];
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) return array_filter(array_map('intval', $decoded));
    return array_filter(array_map('intval', explode(',', (string)$raw)));
}

function asse_product_picker_shortcode($atts) {
    if (!class_exists('WooCommerce')) return '';

    // Get saved product selections: 5 product slots
    $left_upper   = asse_get_product(asse_parse_product_ids(get_option('asse_left_upper_product_id', '')));
    $left_lower   = asse_get_product(asse_parse_product_ids(get_option('asse_left_lower_product_id', '')));
    $center       = asse_get_product(asse_parse_product_ids(get_option('asse_center_product_id', '')));
    $right_upper  = asse_get_product(asse_parse_product_ids(get_option('asse_right_upper_product_id', '')));
    $right_lower  = asse_get_product(asse_parse_product_ids(get_option('asse_right_lower_product_id', '')));

    // Fallback: fill empty slots with on-sale products
    $fallbacks = asse_get_fallback_products(5);
    $fi = 0;
    if (!$left_upper  && isset($fallbacks[$fi])) { $left_upper  = $fallbacks[$fi++]; }
    if (!$left_lower  && isset($fallbacks[$fi])) { $left_lower  = $fallbacks[$fi++]; }
    if (!$center      && isset($fallbacks[$fi])) { $center      = $fallbacks[$fi++]; }
    if (!$right_upper && isset($fallbacks[$fi])) { $right_upper  = $fallbacks[$fi++]; }
    if (!$right_lower && isset($fallbacks[$fi])) { $right_lower  = $fallbacks[$fi++]; }

    ob_start();
    ?>
    <section class="no-padding" style="background-color:#252525;">
        <div class="container-fluid">
            <div class="row">
                <!-- LEFT COLUMN: 2 products stacked -->
                <div class="wpb_column hcode-column-container no-padding vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="no-padding col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <?php if ($left_upper): ?>
                        <div class="asse-product-side" style="height:50%; overflow:hidden;">
                            <?php echo asse_render_product_card($left_upper); ?>
                        </div>
                        <?php endif; ?>
                        <?php if ($left_lower): ?>
                        <div class="asse-product-side" style="height:50%; overflow:hidden;">
                            <?php echo asse_render_product_card($left_lower); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- CENTER COLUMN: product + newsletter -->
                <div class="wpb_column hcode-column-container text-center vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="text-center col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <div class="shop-newsletter-main">
                            <div class="shop-newsletter">
                                <?php if ($center): ?>
                                <?php echo asse_render_product_card_center($center); ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: 2 products stacked -->
                <div class="wpb_column hcode-column-container no-padding vc_col-sm-12 vc_col-md-4 col-xs-mobile-fullwidth" data-front-class="no-padding col-xs-mobile-fullwidth">
                    <div class="vc-column-innner-wrapper">
                        <?php if ($right_upper): ?>
                        <div class="asse-product-side" style="height:50%; overflow:hidden;">
                            <?php echo asse_render_product_card($right_upper); ?>
                        </div>
                        <?php endif; ?>
                        <?php if ($right_lower): ?>
                        <div class="asse-product-side" style="height:50%; overflow:hidden;">
                            <?php echo asse_render_product_card($right_lower); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}

function asse_get_product($ids) {
    if (!empty($ids)) {
        foreach ($ids as $id) {
            $id = intval($id);
            if ($id <= 0) continue;
            $product = wc_get_product($id);
            if ($product && $product->is_visible()) return $product;
        }
    }
    return null;
}

function asse_get_fallback_products($count) {
    $products = [];
    // Try on-sale products first
    if (function_exists('wc_get_product_ids_on_sale')) {
        $sale_ids = wc_get_product_ids_on_sale();
        if (!empty($sale_ids) && is_array($sale_ids)) {
            shuffle($sale_ids);
            foreach ($sale_ids as $id) {
                $p = wc_get_product($id);
                if ($p && $p->is_visible()) {
                    $products[] = $p;
                    if (count($products) >= $count) return $products;
                }
            }
        }
    }
    // Fill remaining from recent products
    if (function_exists('wc_get_products')) {
        $remaining = $count - count($products);
        if ($remaining > 0) {
            $more = wc_get_products(['status' => 'publish', 'limit' => $remaining * 2, 'orderby' => 'date', 'order' => 'DESC']);
            foreach ($more as $p) {
                if ($p->is_visible() && !in_array($p, $products)) {
                    $products[] = $p;
                    if (count($products) >= $count) break;
                }
            }
        }
    }
    return $products;
}

function asse_render_product_card($product) {
    $image = wp_get_attachment_image_url($product->get_image_id(), 'full');
    $link  = $product->get_permalink();
    ob_start();
    ?>
    <a href="<?php echo esc_url($link); ?>">
        <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($product->get_name()); ?>" style="width:100%; height:100%; object-fit:cover;" />
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
//  ADMIN - Product Picker Settings Page (5 slots)
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
        <p>Select which products appear in the 5-product special section on the homepage.</p>
        <p><strong>Layout:</strong> Left (upper + lower) | Center (product + newsletter) | Right (upper + lower)</p>
        <form method="post" action="options.php">
            <?php settings_fields('asse_product_picker'); ?>
            <table class="form-table">
                <tr><th colspan="2"><h3>Left Column</h3></th></tr>
                <tr>
                    <th scope="row">Upper Product</th>
                    <td>
                        <input type="number" name="asse_left_upper_product_id" value="<?php echo esc_attr(get_option('asse_left_upper_product_id', '')); ?>" class="small-text" placeholder="Product ID" min="1" />
                        <button type="button" class="button asse-search-btn" data-target="asse_left_upper_product_id">Search</button>
                        <span class="asse-preview" id="asse_left_upper_preview"></span>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Lower Product</th>
                    <td>
                        <input type="number" name="asse_left_lower_product_id" value="<?php echo esc_attr(get_option('asse_left_lower_product_id', '')); ?>" class="small-text" placeholder="Product ID" min="1" />
                        <button type="button" class="button asse-search-btn" data-target="asse_left_lower_product_id">Search</button>
                        <span class="asse-preview" id="asse_left_lower_preview"></span>
                    </td>
                </tr>
                <tr><th colspan="2"><h3>Center Column</h3></th></tr>
                <tr>
                    <th scope="row">Center Product</th>
                    <td>
                        <input type="number" name="asse_center_product_id" value="<?php echo esc_attr(get_option('asse_center_product_id', '')); ?>" class="small-text" placeholder="Product ID" min="1" />
                        <button type="button" class="button asse-search-btn" data-target="asse_center_product_id">Search</button>
                        <span class="asse-preview" id="asse_center_preview"></span>
                    </td>
                </tr>
                <tr><th colspan="2"><h3>Right Column</h3></th></tr>
                <tr>
                    <th scope="row">Upper Product</th>
                    <td>
                        <input type="number" name="asse_right_upper_product_id" value="<?php echo esc_attr(get_option('asse_right_upper_product_id', '')); ?>" class="small-text" placeholder="Product ID" min="1" />
                        <button type="button" class="button asse-search-btn" data-target="asse_right_upper_product_id">Search</button>
                        <span class="asse-preview" id="asse_right_upper_preview"></span>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Lower Product</th>
                    <td>
                        <input type="number" name="asse_right_lower_product_id" value="<?php echo esc_attr(get_option('asse_right_lower_product_id', '')); ?>" class="small-text" placeholder="Product ID" min="1" />
                        <button type="button" class="button asse-search-btn" data-target="asse_right_lower_product_id">Search</button>
                        <span class="asse-preview" id="asse_right_lower_preview"></span>
                    </td>
                </tr>
            </table>
            <p class="description">Leave any field empty to use on-sale products as fallback.</p>
            <?php submit_button(); ?>
        </form>
    </div>
    <style>
        .asse-preview img { max-width: 50px; vertical-align: middle; margin-left: 8px; border: 1px solid #ddd; border-radius: 4px; }
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
            $('input[name="' + currentTarget + '"]').val(id);
            $('#asse-modal, #asse-modal-overlay').hide();
        });
    });
    </script>
    <?php
}

// Register settings (5 single product IDs)
add_action('admin_init', function() {
    $fields = ['asse_left_upper_product_id', 'asse_left_lower_product_id', 'asse_center_product_id', 'asse_right_upper_product_id', 'asse_right_lower_product_id'];
    foreach ($fields as $field) {
        register_setting('asse_product_picker', $field, ['type' => 'integer', 'sanitize_callback' => 'absint', 'default' => 0]);
    }
});

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