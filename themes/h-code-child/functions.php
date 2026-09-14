<?php
/**
 * H-Code Child Theme Functions
 * Overrides [hcode_shop_top_five] shortcode with proper product section
 * Center carousel: single random featured product with gallery images
 */

if (!defined('ABSPATH')) exit;

// Enqueue parent theme stylesheet
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style('h-code-parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('h-code-child-style', get_stylesheet_uri(), array('h-code-parent-style'));
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN SETTINGS PAGE — Appearance → Special Products
// ═══════════════════════════════════════════════════════════════

add_action('admin_menu', function() {
    add_theme_page(
        'Special Products',
        'Special Products',
        'manage_options',
        'hcode-child-special-products',
        'hcode_child_special_products_page'
    );
});

function hcode_child_special_products_page() {
    if (!current_user_can('manage_options')) return;

    $saved = false;
    if (isset($_POST['hcode_child_save']) && check_admin_referer('hcode_child_special_products', 'hcode_child_nonce')) {
        $fields = ['left_upper','left_lower','center','right_upper','right_lower'];
        $ids = [];
        foreach ($fields as $f) {
            $val = isset($_POST[$f]) ? intval($_POST[$f]) : 0;
            $ids[$f] = $val > 0 ? $val : 0;
        }
        update_option('hcode_child_special_products', $ids);
        $saved = true;
    }

    $ids = get_option('hcode_child_special_products', []);
    $left_upper  = isset($ids['left_upper'])  ? intval($ids['left_upper'])  : 0;
    $left_lower  = isset($ids['left_lower'])  ? intval($ids['left_lower'])  : 0;
    $center      = isset($ids['center'])      ? intval($ids['center'])      : 0;
    $right_upper = isset($ids['right_upper']) ? intval($ids['right_upper']) : 0;
    $right_lower = isset($ids['right_lower']) ? intval($ids['right_lower']) : 0;

    $prod_names = [];
    foreach ([$left_upper, $left_lower, $center, $right_upper, $right_lower] as $pid) {
        if ($pid > 0) {
            $p = wc_get_product($pid);
            $prod_names[$pid] = $p ? $p->get_name() : '(not found)';
        }
    }

    ?>
    <div class="wrap">
        <h1>Special Products</h1>
        <?php if ($saved) : ?>
        <div class="notice notice-success is-dismissible"><p>Product selections saved. <strong>Purge SiteGround cache</strong> to see changes on the frontend.</p></div>
        <?php endif; ?>

        <p>Enter WooCommerce product IDs for each slot. Leave as 0 for auto-selection.</p>

        <form method="post">
            <?php wp_nonce_field('hcode_child_special_products', 'hcode_child_nonce'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Left Upper</th>
                    <td>
                        <input type="number" name="left_upper" value="<?php echo esc_attr($left_upper); ?>" min="0" class="small-text" />
                        <?php if (!empty($left_upper) && isset($prod_names[$left_upper])) : ?>
                        <span class="description">→ <?php echo esc_html($prod_names[$left_upper]); ?></span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Left Lower</th>
                    <td>
                        <input type="number" name="left_lower" value="<?php echo esc_attr($left_lower); ?>" min="0" class="small-text" />
                        <?php if (!empty($left_lower) && isset($prod_names[$left_lower])) : ?>
                        <span class="description">→ <?php echo esc_html($prod_names[$left_lower]); ?></span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><strong>Center (Featured)</strong></th>
                    <td>
                        <input type="number" name="center" value="<?php echo esc_attr($center); ?>" min="0" class="small-text" />
                        <?php if (!empty($center) && isset($prod_names[$center])) : ?>
                        <span class="description">→ <?php echo esc_html($prod_names[$center]); ?></span>
                        <?php endif; ?>
                        <p class="description">This product shows in the center carousel with its gallery images + short description. Set to 0 for a random featured product each page load.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Right Upper</th>
                    <td>
                        <input type="number" name="right_upper" value="<?php echo esc_attr($right_upper); ?>" min="0" class="small-text" />
                        <?php if (!empty($right_upper) && isset($prod_names[$right_upper])) : ?>
                        <span class="description">→ <?php echo esc_html($prod_names[$right_upper]); ?></span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Right Lower</th>
                    <td>
                        <input type="number" name="right_lower" value="<?php echo esc_attr($right_lower); ?>" min="0" class="small-text" />
                        <?php if (!empty($right_lower) && isset($prod_names[$right_lower])) : ?>
                        <span class="description">→ <?php echo esc_html($prod_names[$right_lower]); ?></span>
                        <?php endif; ?>
                    </td>
                </tr>
            </table>

            <h3>How to find Product IDs</h3>
            <p>Go to <strong>Products → All Products</strong>. Hover over any product — the ID appears in the URL as <code>post=1234</code>.</p>

            <h3>Auto-Selection Fallback</h3>
            <p>When a slot is set to 0:</p>
            <ul style="list-style:disc;padding-left:20px;">
                <li><strong>Center</strong>: Random featured product (WooCommerce ⭐ star) each page load</li>
                <li><strong>Left</strong>: 2 newest published products</li>
                <li><strong>Right</strong>: 2 random products (excluding already used)</li>
            </ul>

            <?php submit_button('Save Product Selections', 'primary', 'hcode_child_save'); ?>
        </form>
    </div>
    <?php
}

// ═══════════════════════════════════════════════════════════════
//  OVERRIDE [hcode_shop_top_five] SHORTCODE
//  Center = single featured product with gallery images
// ═══════════════════════════════════════════════════════════════

add_action('wp_loaded', function() {
    remove_shortcode('hcode_shop_top_five');
    add_shortcode('hcode_shop_top_five', 'hcode_child_shop_top_five_shortcode');
}, 999);

function hcode_child_shop_top_five_shortcode($atts, $content = null) {
    if (!class_exists('WooCommerce')) return '';

    try {
        // Load manual product selections
        $manual = get_option('hcode_child_special_products', []);
        $manual_left_upper  = !empty($manual['left_upper'])  ? intval($manual['left_upper'])  : 0;
        $manual_left_lower  = !empty($manual['left_lower'])  ? intval($manual['left_lower'])  : 0;
        $manual_center      = !empty($manual['center'])      ? intval($manual['center'])      : 0;
        $manual_right_upper = !empty($manual['right_upper']) ? intval($manual['right_upper']) : 0;
        $manual_right_lower = !empty($manual['right_lower']) ? intval($manual['right_lower']) : 0;

        $left_products = [];
        $right_products = [];
        $center_product = null;

        // ── CENTER: single featured product ──
        if ($manual_center > 0) {
            $center_product = wc_get_product($manual_center);
            if (!$center_product || $center_product->get_status() !== 'publish') {
                $center_product = null;
            }
        }
        if (!$center_product) {
            // Get all featured products, pick one randomly
            $featured = wc_get_products(['status'=>'publish','limit'=>-1,'featured'=>true,'orderby'=>'date','order'=>'DESC']);
            if (!empty($featured)) {
                $center_product = $featured[array_rand($featured)];
            }
        }
        if (!$center_product) {
            // Fallback: on-sale product
            $on_sale = wc_get_products(['status'=>'publish','limit'=>1,'on_sale'=>true,'orderby'=>'rand']);
            if (!empty($on_sale)) {
                $center_product = $on_sale[0];
            }
        }
        if (!$center_product) {
            // Last resort: newest product
            $newest = wc_get_products(['status'=>'publish','limit'=>1,'orderby'=>'date','order'=>'DESC']);
            if (!empty($newest)) {
                $center_product = $newest[0];
            }
        }

        // ── LEFT column ──
        if ($manual_left_upper > 0) {
            $p = wc_get_product($manual_left_upper);
            if ($p && $p->get_status() === 'publish') $left_products[] = $p;
        }
        if ($manual_left_lower > 0) {
            $p = wc_get_product($manual_left_lower);
            if ($p && $p->get_status() === 'publish') $left_products[] = $p;
        }
        if (count($left_products) < 2) {
            $existing_ids = [];
            foreach ($left_products as $p) { $existing_ids[] = $p->get_id(); }
            if ($center_product) { $existing_ids[] = $center_product->get_id(); }
            $more = wc_get_products(['status'=>'publish','limit'=>2-count($left_products),'orderby'=>'date','order'=>'DESC','exclude'=>$existing_ids]);
            if (!empty($more)) $left_products = array_merge($left_products, $more);
        }

        // ── RIGHT column ──
        if ($manual_right_upper > 0) {
            $p = wc_get_product($manual_right_upper);
            if ($p && $p->get_status() === 'publish') $right_products[] = $p;
        }
        if ($manual_right_lower > 0) {
            $p = wc_get_product($manual_right_lower);
            if ($p && $p->get_status() === 'publish') $right_products[] = $p;
        }
        if (count($right_products) < 2) {
            $exclude = [];
            foreach (array_merge([$center_product], $left_products, $right_products) as $p) {
                if ($p && method_exists($p, 'get_id')) $exclude[] = $p->get_id();
            }
            $more = wc_get_products(['status'=>'publish','limit'=>2-count($right_products),'orderby'=>'rand','exclude'=>array_unique($exclude)]);
            if (!empty($more)) $right_products = array_merge($right_products, $more);
        }

        if (!$center_product && empty($left_products) && empty($right_products)) return '';

        ob_start();
        ?>
        <section>
            <div class="container">
                <div class="row">
                    <?php if (!empty($left_products)) : ?>
                    <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                        <?php foreach ($left_products as $i => $product) : ?>
                        <div class="<?php echo ($i === 0) ? 'first' : 'last'; ?> home-product text-center position-relative overflow-hidden <?php echo ($i === 0) ? 'margin-ten no-margin-top' : 'margin-ten no-margin-bottom'; ?>">
                            <div class="product-image-wrapper">
                                <?php if ($product->is_on_sale()) : ?>
                                <div class="onsale onsale-style-2"><div class="<?php echo ($i === 0) ? 'sale' : 'new'; ?> white-text">Sale!</div></div>
                                <?php endif; ?>
                                <a href="<?php echo esc_url($product->get_permalink()); ?>">
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
                        <?php if ($center_product) :
                            $gallery_ids = $center_product->get_gallery_image_ids();
                            $all_images = array_merge([$center_product->get_image_id()], $gallery_ids);
                            $all_images = array_filter($all_images); // remove empty/0
                        ?>
                        <div class="special-product-slide owl-carousel owl-theme owl-half-slider dark-pagination dark-pagination-without-next-prev-arrow">
                            <?php foreach ($all_images as $idx => $img_id) : ?>
                            <div class="item text-center">
                                <a href="<?php echo esc_url($center_product->get_permalink()); ?>" class="zoom<?php echo ($idx === 0) ? ' first' : ''; ?><?php echo ($idx === count($all_images) - 1) ? ' last' : ''; ?>">
                                    <?php echo wp_get_attachment_image($img_id, 'full'); ?>
                                </a>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <?php
                            $short_desc = $center_product->get_short_description();
                        ?>
                        <div class="exclusive-style-text text-center">
                            <?php if ($center_product->is_on_sale()) : ?>
                            <div class="onsale onsale-style-2"><div class="sale white-text">Sale!</div></div>
                            <?php endif; ?>
                            <p class="text-med font-weight-600 black-text text-uppercase letter-spacing-2">
                                <a href="<?php echo esc_url($center_product->get_permalink()); ?>"><?php echo esc_html($center_product->get_name()); ?></a>
                            </p>
                            <span class="price product-price-box black-text"><?php echo $center_product->get_price_html(); ?></span>
                            <?php if (!empty($short_desc)) : ?>
                            <div class="short-description" itemprop="description"><?php echo wp_kses_post($short_desc); ?></div>
                            <?php endif; ?>
                            <?php if ($center_product->get_type() === 'simple') : ?>
                            <a href="<?php echo esc_url($center_product->add_to_cart_url()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_simple add_to_cart_button ajax_add_to_cart" data-product_id="<?php echo esc_attr($center_product->get_id()); ?>" data-product_sku="<?php echo esc_attr($center_product->get_sku()); ?>" aria-label="Add to cart: &ldquo;<?php echo esc_attr($center_product->get_name()); ?>&rdquo;" rel="nofollow" data-success_message=""><i class="icon-basket"></i>Add to cart</a>
                            <?php else : ?>
                            <a href="<?php echo esc_url($center_product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_variable add_to_cart_button" data-product_id="<?php echo esc_attr($center_product->get_id()); ?>" data-product_sku="<?php echo esc_attr($center_product->get_sku()); ?>" aria-label="Select options for &ldquo;<?php echo esc_attr($center_product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                            <?php endif; ?>
                        </div>
                        <?php endif; ?>
                    </div>

                    <?php if (!empty($right_products)) : ?>
                    <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                        <?php foreach ($right_products as $i => $product) : ?>
                        <div class="<?php echo ($i === 0) ? 'first' : 'last'; ?> home-product text-center position-relative overflow-hidden <?php echo ($i === 0) ? 'margin-ten no-margin-top' : 'margin-ten no-margin-bottom'; ?>">
                            <div class="product-image-wrapper">
                                <?php if ($product->is_on_sale()) : ?>
                                <div class="onsale onsale-style-2"><div class="<?php echo ($i === 0) ? 'sale' : 'new'; ?> white-text">Sale!</div></div>
                                <?php endif; ?>
                                <a href="<?php echo esc_url($product->get_permalink()); ?>">
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
        error_log('H-Code Child shop error: ' . $e->getMessage());
        return '';
    }
}
