<?php
/**
 * Plugin Name: ASSE Theme Fixer
 * Description: Fixes H-Code theme special product section + lets you pick which products display. Also handles schema injection.
 * Version: 2.0.0
 * Author: AgentSocial
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) exit;

// ═══════════════════════════════════════════════════════════════
//  ADMIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════

add_action('admin_menu', function() {
    add_submenu_page(
        'woocommerce',
        'Special Product Section',
        'Special Products',
        'manage_options',
        'asse-special-products',
        'asse_settings_page'
    );
});

add_action('admin_init', function() {
    register_setting('asse_special_products', 'asse_left_product_ids', [
        'type' => 'string',
        'sanitize_callback' => 'asse_sanitize_ids',
        'default' => '',
    ]);
    register_setting('asse_special_products', 'asse_center_product_ids', [
        'type' => 'string',
        'sanitize_callback' => 'asse_sanitize_ids',
        'default' => '',
    ]);
    register_setting('asse_special_products', 'asse_right_product_ids', [
        'type' => 'string',
        'sanitize_callback' => 'asse_sanitize_ids',
        'default' => '',
    ]);
});

function asse_sanitize_ids($val) {
    $ids = array_filter(array_map('absint', explode(',', $val)));
    return implode(',', $ids);
}

function asse_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1>🛍️ Special Product Section Settings</h1>
        <p>Choose which products appear in the 3-column Special Product section. Leave blank for automatic selection.</p>
        <form method="post" action="options.php">
            <?php settings_fields('asse_special_products'); ?>

            <?php
            $left_ids  = get_option('asse_left_product_ids', '');
            $center_ids = get_option('asse_center_product_ids', '');
            $right_ids  = get_option('asse_right_product_ids', '');
            ?>

            <table class="form-table">
                <tr>
                    <th scope="row">Left Column Products</th>
                    <td>
                        <input type="text" name="asse_left_product_ids" id="asse_left_product_ids"
                               value="<?php echo esc_attr($left_ids); ?>"
                               class="regular-text" placeholder="e.g. 42, 87" />
                        <p class="description">Product IDs, comma-separated. These show in the left column (max 2). Leave blank for auto.</p>
                        <div id="asse-left-preview" class="asse-preview"></div>
                        <button type="button" class="button asse-pick-btn" data-target="asse_left_product_ids">🔍 Pick Products</button>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Center Carousel Products</th>
                    <td>
                        <input type="text" name="asse_center_product_ids" id="asse_center_product_ids"
                               value="<?php echo esc_attr($center_ids); ?>"
                               class="regular-text" placeholder="e.g. 15, 23, 37, 51" />
                        <p class="description">Product IDs for the center carousel (sale items). Leave blank for auto.</p>
                        <div id="asse-center-preview" class="asse-preview"></div>
                        <button type="button" class="button asse-pick-btn" data-target="asse_center_product_ids">🔍 Pick Products</button>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Right Column Products</th>
                    <td>
                        <input type="text" name="asse_right_product_ids" id="asse_right_product_ids"
                               value="<?php echo esc_attr($right_ids); ?>"
                               class="regular-text" placeholder="e.g. 63, 91" />
                        <p class="description">Product IDs for the right column (max 2). Leave blank for auto.</p>
                        <div id="asse-right-preview" class="asse-preview"></div>
                        <button type="button" class="button asse-pick-btn" data-target="asse_right_product_ids">🔍 Pick Products</button>
                    </td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>

        <hr>
        <h3>📋 Quick Reference</h3>
        <p><strong>How to find Product IDs:</strong></p>
        <ol>
            <li>Go to <a href="<?php echo admin_url('edit.php?post_type=product'); ?>">Products → All Products</a></li>
            <li>Hover over a product — the ID shows in the status bar link</li>
            <li>Or click the "🔍 Pick Products" button to search and select</li>
        </ol>
        <p><strong>Auto-selection logic (when fields are blank):</strong></p>
        <ul>
            <li><strong>Center:</strong> Products on sale → Featured → Newest</li>
            <li><strong>Left:</strong> Newest Hair category products → Any newest</li>
            <li><strong>Right:</strong> Random Hair category products → Any random</li>
        </ul>
    </div>

    <style>
        .asse-preview { margin: 8px 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .asse-preview-item {
            background: #f6f7f7; border: 1px solid #dcdcde; border-radius: 4px;
            padding: 6px 10px; font-size: 13px; display: flex; align-items: center; gap: 6px;
        }
        .asse-preview-item .remove { color: #b32d2e; cursor: pointer; font-weight: bold; }
        .asse-preview-item .remove:hover { color: #a02728; }
    </style>

    <!-- Product Picker Modal -->
    <div id="asse-picker-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
         width:600px; max-height:80vh; background:#fff; border:1px solid #ccc; border-radius:8px;
         z-index:999999; box-shadow:0 5px 30px rgba(0,0,0,.3); overflow:hidden;">
        <div style="padding:16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0;">Select Products</h3>
            <button type="button" id="asse-picker-close" class="button">✕ Close</button>
        </div>
        <div style="padding:12px;">
            <input type="search" id="asse-picker-search" class="regular-text" placeholder="Search products..."
                   style="width:100%; margin-bottom:12px;" />
            <div id="asse-picker-results" style="max-height:50vh; overflow-y:auto;"></div>
        </div>
        <div style="padding:12px; border-top:1px solid #eee; text-align:right;">
            <button type="button" id="asse-picker-apply" class="button button-primary">Apply Selection</button>
        </div>
    </div>
    <div id="asse-picker-overlay" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0;
         background:rgba(0,0,0,.5); z-index:999998;"></div>

    <script>
    jQuery(function($) {
        // ─── Product Preview ───
        function loadPreview(fieldId) {
            var ids = $('#' + fieldId).val();
            var previewId = fieldId.replace('asse_', 'asse-').replace('_product_ids', '-preview');
            var $preview = $('#' + previewId);
            $preview.html('');
            if (!ids) return;
            var idArr = ids.split(',').map(function(id) { return id.trim(); }).filter(Boolean);
            if (!idArr.length) return;
            $.post(ajaxurl, {
                action: 'asse_get_product_names',
                ids: ids,
                nonce: '<?php echo wp_create_nonce("asse_admin_nonce"); ?>'
            }, function(resp) {
                if (resp.success && resp.data) {
                    $.each(resp.data, function(id, name) {
                        $preview.append(
                            '<span class="asse-preview-item">' +
                            '<strong>#' + id + '</strong> ' + name +
                            ' <span class="remove" data-id="' + id + '" data-field="' + fieldId + '">×</span>' +
                            '</span>'
                        );
                    });
                }
            });
        }

        // Load previews on page load
        loadPreview('asse_left_product_ids');
        loadPreview('asse_center_product_ids');
        loadPreview('asse_right_product_ids');

        // Remove product from preview
        $(document).on('click', '.asse-preview-item .remove', function() {
            var id = $(this).data('id').toString();
            var field = $(this).data('field');
            var ids = $('#' + field).val().split(',').map(function(v) { return v.trim(); }).filter(function(v) { return v !== id; });
            $('#' + field).val(ids.join(', '));
            loadPreview(field);
        });

        // ─── Product Picker Modal ───
        var currentTarget = '';
        var selectedInModal = {};

        $('.asse-pick-btn').on('click', function() {
            currentTarget = $(this).data('target');
            selectedInModal = {};
            // Pre-select existing IDs
            var existing = $('#' + currentTarget).val();
            if (existing) {
                existing.split(',').forEach(function(id) {
                    id = id.trim();
                    if (id) selectedInModal[id] = true;
                });
            }
            $('#asse-picker-modal, #asse-picker-overlay').show();
            $('#asse-picker-search').val('').trigger('keyup');
        });

        $('#asse-picker-close, #asse-picker-overlay').on('click', function() {
            $('#asse-picker-modal, #asse-picker-overlay').hide();
        });

        // Search products
        var searchTimer;
        $('#asse-picker-search').on('keyup', function() {
            clearTimeout(searchTimer);
            var q = $(this).val();
            searchTimer = setTimeout(function() {
                $.post(ajaxurl, {
                    action: 'asse_search_products',
                    q: q,
                    nonce: '<?php echo wp_create_nonce("asse_admin_nonce"); ?>'
                }, function(resp) {
                    var $results = $('#asse-picker-results');
                    $results.html('');
                    if (resp.success && resp.data) {
                        $.each(resp.data, function(i, p) {
                            var checked = selectedInModal[p.id] ? 'checked' : '';
                            $results.append(
                                '<label style="display:block;padding:8px;border-bottom:1px solid #f0f0f0;cursor:pointer;">' +
                                '<input type="checkbox" class="asse-pick-cb" value="' + p.id + '" ' + checked + ' /> ' +
                                '<strong>#' + p.id + '</strong> ' + p.name + ' — ' + p.price +
                                (p.on_sale ? ' <span style="color:#b32d2e;">Sale!</span>' : '') +
                                '</label>'
                            );
                        });
                    } else {
                        $results.html('<p style="padding:12px;color:#999;">No products found.</p>');
                    }
                });
            }, 300);
        });

        // Track checkbox changes
        $(document).on('change', '.asse-pick-cb', function() {
            var id = $(this).val();
            if ($(this).is(':checked')) {
                selectedInModal[id] = true;
            } else {
                delete selectedInModal[id];
            }
        });

        // Apply selection
        $('#asse-picker-apply').on('click', function() {
            var ids = Object.keys(selectedInModal).join(', ');
            $('#' + currentTarget).val(ids);
            loadPreview(currentTarget);
            $('#asse-picker-modal, #asse-picker-overlay').hide();
        });
    });
    </script>
    <?php
}

// ─── AJAX: Search Products ───
add_action('wp_ajax_asse_search_products', function() {
    check_ajax_referer('asse_admin_nonce', 'nonce');
    if (!current_user_can('manage_options')) wp_die('Unauthorized');

    $q = isset($_POST['q']) ? sanitize_text_field($_POST['q']) : '';
    $args = [
        'status'  => 'publish',
        'limit'   => 20,
        'orderby' => 'title',
        'order'   => 'ASC',
    ];
    if ($q) {
        $args['s'] = $q;
    }
    $products = wc_get_products($args);
    $results = [];
    foreach ($products as $p) {
        $results[] = [
            'id'      => $p->get_id(),
            'name'    => $p->get_name(),
            'price'   => $p->get_price_html(),
            'on_sale' => $p->is_on_sale(),
        ];
    }
    wp_send_json_success($results);
});

// ─── AJAX: Get Product Names ───
add_action('wp_ajax_asse_get_product_names', function() {
    check_ajax_referer('asse_admin_nonce', 'nonce');
    if (!current_user_can('manage_options')) wp_die('Unauthorized');

    $ids = isset($_POST['ids']) ? sanitize_text_field($_POST['ids']) : '';
    $id_arr = array_filter(array_map('absint', explode(',', $ids)));
    if (empty($id_arr)) wp_send_json_success([]);

    $names = [];
    foreach ($id_arr as $id) {
        $p = wc_get_product($id);
        if ($p) {
            $names[$id] = $p->get_name();
        }
    }
    wp_send_json_success($names);
});


// ═══════════════════════════════════════════════════════════════
//  SHORTCODE OVERRIDE — SPECIAL PRODUCT SECTION
// ═══════════════════════════════════════════════════════════════

add_action('wp_loaded', function() {
    remove_shortcode('hcode_shop_top_five');
    add_shortcode('hcode_shop_top_five', 'asse_shop_top_five_shortcode');
}, 999);

function asse_shop_top_five_shortcode($atts, $content = null) {
    if (!class_exists('WooCommerce')) return '';

    $atts = shortcode_atts(array(
        'hcode_shop_top_five_style' => '',
        'hcode_shop_top_five_cat' => '',
        'hcode_shop_top_five_product_id' => '',
        'hcode_shop_top_five_number_product' => '',
        'hcode_shop_top_five_column' => '',
        'hcode_shop_top_five_column_margin' => '',
    ), $atts, 'hcode_shop_top_five');

    // ─── Check for manually selected products ───
    $manual_left   = array_filter(array_map('absint', explode(',', get_option('asse_left_product_ids', ''))));
    $manual_center = array_filter(array_map('absint', explode(',', get_option('asse_center_product_ids', ''))));
    $manual_right  = array_filter(array_map('absint', explode(',', get_option('asse_right_product_ids', ''))));

    // ─── CENTER: Products on sale (carousel) ───
    if (!empty($manual_center)) {
        $sale_products = array_filter(array_map('wc_get_product', $manual_center));
        $sale_products = array_filter($sale_products, function($p) { return $p && $p->get_status() === 'publish'; });
    } else {
        $sale_args = [
            'status'  => 'publish',
            'limit'   => 6,
            'on_sale' => true,
            'orderby' => 'date',
            'order'   => 'DESC',
        ];
        $sale_products = wc_get_products($sale_args);
        if (empty($sale_products)) {
            $sale_products = wc_get_products([
                'status'   => 'publish',
                'limit'    => 6,
                'featured' => true,
                'orderby'  => 'date',
                'order'    => 'DESC',
            ]);
        }
        if (empty($sale_products)) {
            $sale_products = wc_get_products([
                'status'  => 'publish',
                'limit'   => 6,
                'orderby' => 'date',
                'order'   => 'DESC',
            ]);
        }
    }

    // ─── LEFT: Newest non-sale products ───
    if (!empty($manual_left)) {
        $left_products = array_filter(array_map('wc_get_product', $manual_left));
        $left_products = array_filter($left_products, function($p) { return $p && $p->get_status() === 'publish'; });
    } else {
        $left_args = [
            'status'  => 'publish',
            'limit'   => 2,
            'on_sale' => false,
            'orderby' => 'date',
            'order'   => 'DESC',
            'category' => ['hair'],
        ];
        $left_products = wc_get_products($left_args);
        if (empty($left_products)) {
            unset($left_args['category']);
            $left_products = wc_get_products($left_args);
        }
    }

    // ─── RIGHT: Random non-sale products ───
    if (!empty($manual_right)) {
        $right_products = array_filter(array_map('wc_get_product', $manual_right));
        $right_products = array_filter($right_products, function($p) { return $p && $p->get_status() === 'publish'; });
    } else {
        $exclude = array_merge(
            wp_list_pluck($sale_products, 'id'),
            wp_list_pluck($left_products, 'id')
        );
        $right_args = [
            'status'  => 'publish',
            'limit'   => 2,
            'on_sale' => false,
            'orderby' => 'rand',
            'category' => ['hair'],
            'exclude' => $exclude,
        ];
        $right_products = wc_get_products($right_args);
        if (empty($right_products)) {
            unset($right_args['category']);
            $right_products = wc_get_products($right_args);
        }
    }

    if (empty($sale_products) && empty($left_products) && empty($right_products)) {
        return '';
    }

    ob_start();
    ?>
    <section>
        <div class="container">
            <div class="row">
                <?php if (!empty($left_products)) : ?>
                <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                    <?php foreach ($left_products as $i => $product) :
                        $post_classes = esc_attr(implode(' ', get_post_class('', $product->get_id())));
                        $pos = ($i === 0) ? 'first home-product text-center position-relative overflow-hidden margin-ten no-margin-top' : 'last home-product text-center position-relative overflow-hidden margin-ten no-margin-bottom';
                    ?>
                    <div class="<?php echo $pos . ' ' . $post_classes; ?>">
                        <div class="product-image-wrapper">
                            <?php if ($product->is_on_sale()) : ?>
                                <span class="onsale onsale-style-2">Sale!</span>
                            <?php endif; ?>
                            <a href="<?php echo esc_url($product->get_permalink()); ?>" class="woocommerce-LoopProduct-link woocommerce-loop-product__link">
                                <?php echo $product->get_image('shop_catalog'); ?>
                            </a>
                        </div>
                        <div class="product-content-wrapper">
                            <div class="product-content">
                                <span class="product-name text-uppercase">
                                    <a href="<?php echo esc_url($product->get_permalink()); ?>"><?php echo esc_html($product->get_name()); ?></a>
                                </span>
                                <span class="price product-price-box black-text"><?php echo $product->get_price_html(); ?></span>
                                <div class="quick-buy">
                                    <div class="product-share">
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_<?php echo $product->get_type(); ?>" data-product_id="<?php echo $product->get_id(); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Select options for &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <div class="col-md-4 col-sm-4 col-xs-12 exclusive-style no-padding xs-margin-top-ten hcode-blog-feature-2">
                    <div class="special-product-slide owl-carousel owl-theme owl-half-slider dark-pagination dark-pagination-without-next-prev-arrow">
                        <?php foreach ($sale_products as $product) :
                            $image_ids = $product->get_gallery_image_ids();
                            $fc = ($product === reset($sale_products)) ? ' first' : '';
                            $lc = ($product === end($sale_products)) ? ' last' : '';
                            if (!empty($image_ids)) :
                                foreach (array_slice($image_ids, 0, 4) as $img_id) :
                        ?>
                        <div class="item text-center">
                            <a href="<?php echo esc_url($product->get_permalink()); ?>" class="zoom<?php echo $fc . $lc; ?>">
                                <?php echo wp_get_attachment_image($img_id, 'full'); ?>
                            </a>
                        </div>
                        <?php
                                endforeach;
                            else :
                        ?>
                        <div class="item text-center">
                            <a href="<?php echo esc_url($product->get_permalink()); ?>" class="zoom<?php echo $fc . $lc; ?>">
                                <?php echo $product->get_image('full'); ?>
                            </a>
                        </div>
                        <?php endif; endforeach; ?>
                    </div>
                </div>

                <?php if (!empty($right_products)) : ?>
                <div class="col-md-4 col-sm-4 col-xs-12 hcode-blog-5">
                    <?php foreach ($right_products as $i => $product) :
                        $post_classes = esc_attr(implode(' ', get_post_class('', $product->get_id())));
                        $pos = ($i === 0) ? 'first home-product text-center position-relative overflow-hidden margin-ten no-margin-top' : 'last home-product text-center position-relative overflow-hidden margin-ten no-margin-bottom';
                    ?>
                    <div class="<?php echo $pos . ' ' . $post_classes; ?>">
                        <div class="product-image-wrapper">
                            <?php if ($product->is_on_sale()) : ?>
                                <span class="onsale onsale-style-2">Sale!</span>
                            <?php endif; ?>
                            <a href="<?php echo esc_url($product->get_permalink()); ?>" class="woocommerce-LoopProduct-link woocommerce-loop-product__link">
                                <?php echo $product->get_image('shop_catalog'); ?>
                            </a>
                        </div>
                        <div class="product-content-wrapper">
                            <div class="product-content">
                                <span class="product-name text-uppercase">
                                    <a href="<?php echo esc_url($product->get_permalink()); ?>"><?php echo esc_html($product->get_name()); ?></a>
                                </span>
                                <span class="price product-price-box black-text"><?php echo $product->get_price_html(); ?></span>
                                <div class="quick-buy">
                                    <div class="product-share">
                                        <a href="<?php echo esc_url($product->get_permalink()); ?>" data-quantity="1" class="highlight-button-dark btn btn-small no-margin-right quick-buy-btn button product_type_<?php echo $product->get_type(); ?>" data-product_id="<?php echo $product->get_id(); ?>" data-product_sku="<?php echo esc_attr($product->get_sku()); ?>" aria-label="Select options for &ldquo;<?php echo esc_attr($product->get_name()); ?>&rdquo;" rel="nofollow"><i class="icon-basket"></i>Select options</a>
                                    </div>
                                </div>
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
}