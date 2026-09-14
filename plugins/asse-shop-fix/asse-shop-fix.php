<?php
/**
 * Plugin Name: ASSE Shop Fix
 * Description: H-Code special product section with short description, matching PLEIJ salon structure.
 * Version: 3.0.2
 * Author: AgentSocial
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) exit;

// ═══════════════════════════════════════════════════════════════
//  ADMIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════

add_action('admin_menu', function() {
    add_submenu_page('woocommerce', 'Special Product Section', 'Special Products', 'manage_options', 'asse-special-products', 'asse_settings_page');
});

add_action('admin_init', function() {
    register_setting('asse_special_products', 'asse_left_product_ids', ['type'=>'string','sanitize_callback'=>'asse_sanitize_ids','default'=>'']);
    register_setting('asse_special_products', 'asse_center_product_ids', ['type'=>'string','sanitize_callback'=>'asse_sanitize_ids','default'=>'']);
    register_setting('asse_special_products', 'asse_right_product_ids', ['type'=>'string','sanitize_callback'=>'asse_sanitize_ids','default'=>'']);
});

function asse_sanitize_ids($val) {
    return implode(',', array_filter(array_map('absint', explode(',', $val))));
}

function asse_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1>🛍️ Special Product Section Settings</h1>
        <p>Choose which products appear in the 3-column Special Product section. Leave blank for automatic selection.</p>
        <form method="post" action="options.php">
            <?php settings_fields('asse_special_products'); ?>
            <table class="form-table">
                <tr><th>Left Column Products</th><td><input type="text" name="asse_left_product_ids" value="<?php echo esc_attr(get_option('asse_left_product_ids','')); ?>" class="regular-text" placeholder="e.g. 42, 87" /><p class="description">Product IDs, comma-separated (max 2).</p></td></tr>
                <tr><th>Center Carousel Products</th><td><input type="text" name="asse_center_product_ids" value="<?php echo esc_attr(get_option('asse_center_product_ids','')); ?>" class="regular-text" placeholder="e.g. 15, 23, 37" /><p class="description">Sale/featured products for center carousel.</p></td></tr>
                <tr><th>Right Column Products</th><td><input type="text" name="asse_right_product_ids" value="<?php echo esc_attr(get_option('asse_right_product_ids','')); ?>" class="regular-text" placeholder="e.g. 63, 91" /><p class="description">Product IDs for right column (max 2).</p></td></tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// ═══════════════════════════════════════════════════════════════
//  SHORTCODE — Matches PLEIJ salon's H-Code structure
// ═══════════════════════════════════════════════════════════════

add_action('wp_loaded', function() {
    remove_shortcode('hcode_shop_top_five');
    add_shortcode('hcode_shop_top_five', 'asse_shop_top_five_shortcode');
}, 999);

function asse_shop_top_five_shortcode($atts, $content = null) {
    if (!class_exists('WooCommerce')) return '<!-- ASSE: WooCommerce not active -->';

    try {
        // ─── Get products ───
        $sale_products = [];
        $left_products = [];
        $right_products = [];

        // Center: sale/featured items
        $manual_center = array_values(array_filter(array_map('absint', explode(',', get_option('asse_center_product_ids', '')))));
        if (!empty($manual_center)) {
            foreach ($manual_center as $pid) {
                try {
                    $p = wc_get_product($pid);
                    if ($p && $p->get_status() === 'publish') $sale_products[] = $p;
                } catch (\Throwable $e) { /* skip invalid product */ }
            }
        }
        if (empty($sale_products)) {
            try {
                $sale_products = wc_get_products(['status'=>'publish','limit'=>6,'on_sale'=>true,'orderby'=>'date','order'=>'DESC']);
            } catch (\Throwable $e) { $sale_products = []; }
        }
        if (empty($sale_products)) {
            try {
                $sale_products = wc_get_products(['status'=>'publish','limit'=>6,'featured'=>true,'orderby'=>'date','order'=>'DESC']);
            } catch (\Throwable $e) { $sale_products = []; }
        }
        if (empty($sale_products)) {
            try {
                $sale_products = wc_get_products(['status'=>'publish','limit'=>6,'orderby'=>'date','order'=>'DESC']);
            } catch (\Throwable $e) { $sale_products = []; }
        }

        // Left: newest products
        $manual_left = array_values(array_filter(array_map('absint', explode(',', get_option('asse_left_product_ids', '')))));
        if (!empty($manual_left)) {
            foreach ($manual_left as $pid) {
                try {
                    $p = wc_get_product($pid);
                    if ($p && $p->get_status() === 'publish') $left_products[] = $p;
                } catch (\Throwable $e) { /* skip */ }
            }
        }
        if (empty($left_products)) {
            try {
                $left_products = wc_get_products(['status'=>'publish','limit'=>2,'orderby'=>'date','order'=>'DESC']);
            } catch (\Throwable $e) { $left_products = []; }
        }

        // Right: other products
        $exclude = [];
        foreach (array_merge($sale_products ?: [], $left_products ?: []) as $p) {
            if ($p && method_exists($p, 'get_id')) $exclude[] = $p->get_id();
        }
        $manual_right = array_values(array_filter(array_map('absint', explode(',', get_option('asse_right_product_ids', '')))));
        if (!empty($manual_right)) {
            foreach ($manual_right as $pid) {
                try {
                    $p = wc_get_product($pid);
                    if ($p && $p->get_status() === 'publish') $right_products[] = $p;
                } catch (\Throwable $e) { /* skip */ }
            }
        }
        if (empty($right_products)) {
            try {
                $right_products = wc_get_products(['status'=>'publish','limit'=>2,'orderby'=>'rand','exclude'=>array_unique($exclude)]);
            } catch (\Throwable $e) { $right_products = []; }
        }

        if (empty($sale_products) && empty($left_products) && empty($right_products)) {
            return '<!-- ASSE: No products found -->';
        }

        $sale_first = !empty($sale_products) ? $sale_products[0] : null;
        $sale_last  = !empty($sale_products) ? $sale_products[count($sale_products) - 1] : null;

        ob_start();
        ?>
        <section>
            <div class="container">
                <div class="row">
                    <?php if (!empty($left_products)) : ?>
                    <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                        <?php foreach ($left_products as $i => $product) :
                            $pos_class = ($i === 0) ? 'first' : 'last';
                            $post_classes = get_post_class('', $product->get_id());
                            if (is_array($post_classes)) $post_classes = implode(' ', $post_classes);
                            else $post_classes = '';
                        ?>
                        <div class="<?php echo esc_attr($pos_class . ' home-product text-center position-relative overflow-hidden ' . (($i === 0) ? 'margin-ten no-margin-top' : 'margin-ten no-margin-bottom') . ' ' . $post_classes); ?>">
                            <div class="product-image-wrapper">
                                <?php if ($product->is_on_sale()) : ?>
                                <div class="onsale onsale-style-2"><div class="<?php echo ($i === 0) ? 'sale' : 'new'; ?> white-text">Sale!</div></div>
                                <?php endif; ?>
                                <a href="<?php echo esc_url($product->get_permalink()); ?>" class="woocommerce-LoopProduct-link woocommerce-loop-product__link">
                                    <?php echo $product->get_image('shop_catalog'); ?>
                                </a>
                            </div>
                            <div class="product-content-wrapper">
                                <div class="product-content">
                                    <span class="product-name text-uppercase hcode-blog-2">
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>"><?php echo esc_html($product->get_name()); ?></a>
                                    </span>
                                    <span class="price product-price-box black-text"><?php echo $product->get_price_html(); ?></span>
                                    <div class="quick-buy"><div class="product-share">
                                        <?php if ($product->get_type() === 'simple') : ?>
                                        <a href="<?php echo esc_url($product->add_to_cart_url()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_simple add_to_cart_button ajax_add_to_cart" data-product_id="<?php echo esc_attr($product->get_id()); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Add to cart: &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Add to cart</a>
                                        <?php else : ?>
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_variable add_to_cart_button" data-product_id="<?php echo esc_attr($product->get_id()); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Select options for &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                                        <?php endif; ?>
                                    </div></div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>

                    <div class="col-md-4 col-sm-4 col-xs-12 exclusive-style no-padding xs-margin-top-ten hcode-blog-feature-2">
                        <div class="special-product-slide owl-carousel owl-prev-next-simple black-cursor hcode-featured-slider owl-theme">
                            <?php foreach ($sale_products as $product) :
                                $fc = ($product === $sale_first) ? ' first' : '';
                                $lc = ($product === $sale_last) ? ' last' : '';
                                $image_ids = $product->get_gallery_image_ids();
                                if (!empty($image_ids)) :
                                    foreach (array_slice($image_ids, 0, 4) as $img_id) :
                            ?>
                            <div class="item text-center">
                                <a href="<?php echo esc_url($product->get_permalink()); ?>" class="zoom<?php echo esc_attr($fc . $lc); ?>">
                                    <?php echo wp_get_attachment_image($img_id, 'full'); ?>
                                </a>
                            </div>
                            <?php
                                    endforeach;
                                else :
                            ?>
                            <div class="item text-center">
                                <a href="<?php echo esc_url($product->get_permalink()); ?>" class="zoom<?php echo esc_attr($fc . $lc); ?>">
                                    <?php echo $product->get_image('full'); ?>
                                </a>
                            </div>
                            <?php
                                endif;
                            endforeach; ?>
                        </div>
                        <?php if ($sale_first) :
                            $short_desc = $sale_first->get_short_description();
                        ?>
                        <div class="exclusive-style-text text-center">
                            <?php if ($sale_first->is_on_sale()) : ?>
                            <div class="onsale onsale-style-2"><div class="sale white-text">Sale!</div></div>
                            <?php endif; ?>
                            <p class="text-med font-weight-600 black-text text-uppercase letter-spacing-2">
                                <a href="<?php echo esc_url($sale_first->get_permalink()); ?>"><?php echo esc_html($sale_first->get_name()); ?></a>
                            </p>
                            <span class="price product-price-box black-text"><?php echo $sale_first->get_price_html(); ?></span>
                            <?php if (!empty($short_desc)) : ?>
                            <div class="short-description" itemprop="description"><?php echo wp_kses_post($short_desc); ?></div>
                            <?php endif; ?>
                            <a href="<?php echo esc_url($sale_first->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_simple" data-product_id="<?php echo esc_attr($sale_first->get_id()); ?>" data-product_sku="<?php echo esc_attr($sale_first->get_sku()); ?>" aria-label="Read more about &ldquo;<?php echo esc_attr($sale_first->get_name()); ?>&rdquo;" rel="nofollow" data-success_message=""><i class="icon-basket"></i>Read more</a>
                        </div>
                        <?php endif; ?>
                    </div>

                    <?php if (!empty($right_products)) : ?>
                    <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                        <?php foreach ($right_products as $i => $product) :
                            $pos_class = ($i === 0) ? 'first' : 'last';
                            $post_classes = get_post_class('', $product->get_id());
                            if (is_array($post_classes)) $post_classes = implode(' ', $post_classes);
                            else $post_classes = '';
                        ?>
                        <div class="<?php echo esc_attr($pos_class . ' home-product text-center position-relative overflow-hidden ' . (($i === 0) ? 'margin-ten no-margin-top' : 'margin-ten no-margin-bottom') . ' ' . $post_classes); ?>">
                            <div class="product-image-wrapper">
                                <?php if ($product->is_on_sale()) : ?>
                                <div class="onsale onsale-style-2"><div class="<?php echo ($i === 0) ? 'sale' : 'new'; ?> white-text">Sale!</div></div>
                                <?php endif; ?>
                                <a href="<?php echo esc_url($product->get_permalink()); ?>" class="woocommerce-LoopProduct-link woocommerce-loop-product__link">
                                    <?php echo $product->get_image('shop_catalog'); ?>
                                </a>
                            </div>
                            <div class="product-content-wrapper">
                                <div class="product-content">
                                    <span class="product-name text-uppercase hcode-blog-2">
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>"><?php echo esc_html($product->get_name()); ?></a>
                                    </span>
                                    <span class="price product-price-box black-text"><?php echo $product->get_price_html(); ?></span>
                                    <div class="quick-buy"><div class="product-share">
                                        <?php if ($product->get_type() === 'simple') : ?>
                                        <a href="<?php echo esc_url($product->add_to_cart_url()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_simple add_to_cart_button ajax_add_to_cart" data-product_id="<?php echo esc_attr($product->get_id()); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Add to cart: &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Add to cart</a>
                                        <?php else : ?>
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_variable add_to_cart_button" data-product_id="<?php echo esc_attr($product->get_id()); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Select options for &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                                        <?php endif; ?>
                                    </div></div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </section>
        <?php
        return ob_get_clean();

    } catch (\Throwable $e) {
        // Show the ACTUAL error message in HTML comment so we can diagnose
        return '<!-- ASSE Shop Fix ERROR: ' . esc_html($e->getMessage()) . ' in ' . esc_html($e->getFile()) . ':' . esc_html($e->getLine()) . ' -->';
    }
}

// ═══════════════════════════════════════════════════════════════
//  NEWSLETTER CENTERING CSS
// ═══════════════════════════════════════════════════════════════

add_action('wp_head', function() {
    if (!class_exists('WooCommerce')) return;
    ?>
    <style id="asse-newsletter-center">
    .shop-newsletter .mc4wp-form-fields { text-align: center; }
    .shop-newsletter .mc4wp-form-fields p { text-align: center; }
    .shop-newsletter .mc4wp-form input[type="email"] { display: block; margin: 0 auto !important; text-align: center; }
    .shop-newsletter .mc4wp-form input[type="submit"] { display: block; margin: 15px auto 0 !important; }
    .shop-newsletter .mc4wp-form label { display: block; text-align: center; }
    </style>
    <?php
});
