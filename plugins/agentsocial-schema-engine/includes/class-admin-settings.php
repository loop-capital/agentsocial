<?php
/**
 * ASSE Admin Settings — WordPress admin UI for managing schema data
 */
class ASSE_Admin_Settings {

    public function add_menu_pages() {
        add_menu_page(
            'Schema Engine',
            'Schema Engine',
            'manage_options',
            'asse-settings',
            [ $this, 'render_business_page' ],
            'dashicons-info',
            80
        );

        add_submenu_page( 'asse-settings', 'Business Info', 'Business Info', 'manage_options', 'asse-settings', [ $this, 'render_business_page' ] );
        add_submenu_page( 'asse-settings', 'Services', 'Services', 'manage_options', 'asse-services', [ $this, 'render_services_page' ] );
        add_submenu_page( 'asse-settings', 'FAQ', 'FAQ', 'manage_options', 'asse-faq', [ $this, 'render_faq_page' ] );
        add_submenu_page( 'asse-settings', 'Reviews', 'Reviews', 'manage_options', 'asse-reviews', [ $this, 'render_reviews_page' ] );
        add_submenu_page( 'asse-settings', 'Team', 'Team', 'manage_options', 'asse-team', [ $this, 'render_team_page' ] );
        add_submenu_page( 'asse-settings', 'Schema Preview', 'Schema Preview', 'manage_options', 'asse-preview', [ $this, 'render_preview_page' ] );
    }

    public function enqueue_assets( $hook ) {
        if ( strpos( $hook, 'asse' ) === false ) {
            return;
        }
        wp_enqueue_style( 'asse-admin', ASSE_PLUGIN_URL . 'assets/css/admin.css', [], ASSE_VERSION );
    }

    public function register_settings() {
        $fields = [
            'asse_business_name', 'asse_business_description', 'asse_business_type',
            'asse_street_address', 'asse_city', 'asse_state', 'asse_postal_code',
            'asse_country', 'asse_phone', 'asse_email', 'asse_website',
            'asse_latitude', 'asse_longitude', 'asse_price_range',
            'asse_image', 'asse_logo', 'asse_enabled',
            'asse_faq_enabled', 'asse_services_enabled', 'asse_reviews_enabled', 'asse_team_enabled',
        ];

        foreach ( $fields as $field ) {
            register_setting( 'asse_settings', $field );
        }

        // Hours and sameAs stored as serialized arrays
        register_setting( 'asse_settings', 'asse_hours', [ 'sanitize_callback' => [ $this, 'sanitize_hours' ] ] );
        register_setting( 'asse_settings', 'asse_same_as', [ 'sanitize_callback' => [ $this, 'sanitize_same_as' ] ] );
    }

    public function sanitize_hours( $input ) {
        if ( ! is_array( $input ) ) {
            return [];
        }
        $clean = [];
        foreach ( $input as $h ) {
            if ( ! empty( $h['days'] ) && ! empty( $h['open'] ) && ! empty( $h['close'] ) ) {
                $clean[] = [
                    'days'  => array_map( 'sanitize_text_field', (array) $h['days'] ),
                    'open'  => sanitize_text_field( $h['open'] ),
                    'close' => sanitize_text_field( $h['close'] ),
                ];
            }
        }
        return $clean;
    }

    public function sanitize_same_as( $input ) {
        if ( ! is_array( $input ) ) {
            return [];
        }
        return array_map( 'esc_url_raw', array_filter( $input ) );
    }

    // ---- Render Pages ----

    public function render_business_page() {
        if ( isset( $_POST['asse_save_business'] ) && check_admin_referer( 'asse_business_nonce' ) ) {
            $this->save_business_settings( $_POST );
            echo '<div class="notice notice-success"><p>Business info saved!</p></div>';
        }

        $hours = get_option( 'asse_hours', [] );
        $same_as = get_option( 'asse_same_as', [] );
        ?>
        <div class="wrap asse-admin">
            <h1>🏢 Business Info</h1>
            <p>Configure your local business details for schema markup and AI search optimization.</p>

            <form method="post">
                <?php wp_nonce_field( 'asse_business_nonce' ); ?>

                <table class="form-table">
                    <tr><th>Enabled</th><td><label><input type="checkbox" name="asse_enabled" value="1" <?php checked( get_option( 'asse_enabled', '1' ), '1' ); ?>> Output schema markup on this site</label></td></tr>
                    <tr><th>Business Name</th><td><input type="text" name="asse_business_name" value="<?php echo esc_attr( get_option( 'asse_business_name' ) ); ?>" class="regular-text" required></td></tr>
                    <tr><th>Description</th><td><textarea name="asse_business_description" class="large-text" rows="3"><?php echo esc_textarea( get_option( 'asse_business_description' ) ); ?></textarea></td></tr>
                    <tr><th>Business Type</th><td>
                        <select name="asse_business_type">
                            <?php
                            $types = [ 'SalonOrSpa' => 'Salon / Spa', 'HealthAndBeautyBusiness' => 'Health & Beauty', 'Dentist' => 'Dentist', 'MedicalBusiness' => 'Medical', 'Restaurant' => 'Restaurant', 'AutoRepair' => 'Auto Repair', 'LocalBusiness' => 'Other Local Business' ];
                            $current = get_option( 'asse_business_type', 'SalonOrSpa' );
                            foreach ( $types as $val => $label ) {
                                echo '<option value="' . esc_attr( $val ) . '"' . selected( $current, $val, false ) . '>' . esc_html( $label ) . '</option>';
                            }
                            ?>
                        </select>
                    </td></tr>
                    <tr><th>Street Address</th><td><input type="text" name="asse_street_address" value="<?php echo esc_attr( get_option( 'asse_street_address' ) ); ?>" class="regular-text"></td></tr>
                    <tr><th>City</th><td><input type="text" name="asse_city" value="<?php echo esc_attr( get_option( 'asse_city' ) ); ?>" class="regular-text"></td></tr>
                    <tr><th>State</th><td><input type="text" name="asse_state" value="<?php echo esc_attr( get_option( 'asse_state' ) ); ?>" class="small-text"></td></tr>
                    <tr><th>Postal Code</th><td><input type="text" name="asse_postal_code" value="<?php echo esc_attr( get_option( 'asse_postal_code' ) ); ?>" class="small-text"></td></tr>
                    <tr><th>Country</th><td><input type="text" name="asse_country" value="<?php echo esc_attr( get_option( 'asse_country', 'US' ) ); ?>" class="small-text"></td></tr>
                    <tr><th>Phone</th><td><input type="text" name="asse_phone" value="<?php echo esc_attr( get_option( 'asse_phone' ) ); ?>" class="regular-text" placeholder="+16145472566"></td></tr>
                    <tr><th>Email</th><td><input type="email" name="asse_email" value="<?php echo esc_attr( get_option( 'asse_email' ) ); ?>" class="regular-text"></td></tr>
                    <tr><th>Website</th><td><input type="url" name="asse_website" value="<?php echo esc_attr( get_option( 'asse_website' ) ); ?>" class="regular-text"></td></tr>
                    <tr><th>Latitude</th><td><input type="text" name="asse_latitude" value="<?php echo esc_attr( get_option( 'asse_latitude' ) ); ?>" class="small-text" placeholder="40.1469528"></td></tr>
                    <tr><th>Longitude</th><td><input type="text" name="asse_longitude" value="<?php echo esc_attr( get_option( 'asse_longitude' ) ); ?>" class="small-text" placeholder="-82.9743937"></td></tr>
                    <tr><th>Price Range</th><td><input type="text" name="asse_price_range" value="<?php echo esc_attr( get_option( 'asse_price_range', '$$$' ) ); ?>" class="small-text"></td></tr>
                    <tr><th>Image URL</th><td><input type="url" name="asse_image" value="<?php echo esc_attr( get_option( 'asse_image' ) ); ?>" class="large-text"></td></tr>
                    <tr><th>Logo URL</th><td><input type="url" name="asse_logo" value="<?php echo esc_attr( get_option( 'asse_logo' ) ); ?>" class="large-text"></td></tr>
                </table>

                <h2>Opening Hours</h2>
                <div id="asse-hours-container">
                <?php if ( ! empty( $hours ) ) : ?>
                    <?php foreach ( $hours as $i => $h ) : ?>
                    <div class="asse-hours-row">
                        <select name="asse_hours[<?php echo $i; ?>][days][]" multiple style="height:80px">
                            <?php
                            $days = [ 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday' ];
                            $selected = (array) $h['days'];
                            foreach ( $days as $d ) {
                                echo '<option value="' . $d . '"' . ( in_array( $d, $selected ) ? ' selected' : '' ) . '>' . $d . '</option>';
                            }
                            ?>
                        </select>
                        <input type="time" name="asse_hours[<?php echo $i; ?>][open]" value="<?php echo esc_attr( $h['open'] ); ?>">
                        <span>to</span>
                        <input type="time" name="asse_hours[<?php echo $i; ?>][close]" value="<?php echo esc_attr( $h['close'] ); ?>">
                        <button type="button" class="button asse-remove-hours">×</button>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
                </div>
                <button type="button" class="button" id="asse-add-hours">+ Add Hours</button>

                <h2>Social Links (sameAs)</h2>
                <div id="asse-sameas-container">
                <?php if ( ! empty( $same_as ) ) : ?>
                    <?php foreach ( $same_as as $i => $url ) : ?>
                    <div class="asse-sameas-row">
                        <input type="url" name="asse_same_as[<?php echo $i; ?>]" value="<?php echo esc_attr( $url ); ?>" class="regular-text">
                        <button type="button" class="button asse-remove-sameas">×</button>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
                </div>
                <button type="button" class="button" id="asse-add-sameas">+ Add Link</button>

                <p class="submit">
                    <input type="submit" name="asse_save_business" class="button-primary" value="Save Business Info">
                </p>
            </form>
        </div>
        <script>
        jQuery(document).ready(function($) {
            $('#asse-add-hours').click(function() {
                var idx = $('#asse-hours-container .asse-hours-row').length;
                var row = '<div class="asse-hours-row"><select name="asse_hours[' + idx + '][days][]" multiple style="height:80px"><option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option></select><input type="time" name="asse_hours[' + idx + '][open]" value="09:00"><span>to</span><input type="time" name="asse_hours[' + idx + '][close]" value="18:00"><button type="button" class="button asse-remove-hours">×</button></div>';
                $('#asse-hours-container').append(row);
            });
            $(document).on('click', '.asse-remove-hours', function() { $(this).closest('.asse-hours-row').remove(); });
            $('#asse-add-sameas').click(function() {
                var idx = $('#asse-sameas-container .asse-sameas-row').length;
                $('#asse-sameas-container').append('<div class="asse-sameas-row"><input type="url" name="asse_same_as[' + idx + ']" class="regular-text" placeholder="https://"><button type="button" class="button asse-remove-sameas">×</button></div>');
            });
            $(document).on('click', '.asse-remove-sameas', function() { $(this).closest('.asse-sameas-row').remove(); });
        });
        </script>
        <?php
    }

    private function save_business_settings( $post ) {
        $text_fields = [ 'asse_business_name','asse_business_description','asse_business_type','asse_street_address','asse_city','asse_state','asse_postal_code','asse_country','asse_phone','asse_email','asse_website','asse_latitude','asse_longitude','asse_price_range','asse_image','asse_logo' ];
        foreach ( $text_fields as $f ) {
            if ( isset( $post[ $f ] ) ) {
                update_option( $f, sanitize_text_field( $post[ $f ] ) );
            }
        }
        update_option( 'asse_enabled', isset( $post['asse_enabled'] ) ? '1' : '0' );
    }

    public function render_services_page() {
        echo '<div class="wrap asse-admin"><h1>💇 Services</h1>';
        echo '<p>Manage services for schema markup. Each service appears in structured data for search engines and AI.</p>';
        echo '<a href="' . admin_url( 'post-new.php?post_type=asse_service' ) . '" class="button button-primary">+ Add Service</a>';
        echo '<br><br>';

        $store = new ASSE_Data_Store();
        $services = $store->get_services();
        if ( empty( $services ) ) {
            echo '<p>No services yet. Add your first service to generate Service schema.</p>';
        } else {
            echo '<table class="wp-list-table widefat fixed"><thead><tr><th>Name</th><th>Category</th><th>Description</th><th>Actions</th></tr></thead><tbody>';
            foreach ( $services as $s ) {
                echo '<tr><td><strong>' . esc_html( $s['name'] ) . '</strong></td><td>' . esc_html( $s['category'] ) . '</td><td>' . esc_html( wp_trim_words( $s['description'], 15 ) ) . '</td><td><a href="' . get_edit_post_link( $s['id'] ) . '">Edit</a></td></tr>';
            }
            echo '</tbody></table>';
        }
        echo '</div>';
    }

    public function render_faq_page() {
        echo '<div class="wrap asse-admin"><h1>❓ FAQ</h1>';
        echo '<p>FAQ items generate FAQPage schema for rich snippets and AI citation. Target "People Also Ask" queries.</p>';
        echo '<a href="' . admin_url( 'post-new.php?post_type=asse_faq' ) . '" class="button button-primary">+ Add FAQ</a>';
        echo '<label style="margin-left:15px"><input type="checkbox" ' . checked( get_option( 'asse_faq_enabled', '1' ), '1', false ) . ' disabled> FAQ schema enabled</label>';
        echo '<br><br>';

        $store = new ASSE_Data_Store();
        $faqs = $store->get_faqs();
        if ( empty( $faqs ) ) {
            echo '<p>No FAQ items yet. Add questions that target "People Also Ask" queries for your business.</p>';
        } else {
            echo '<table class="wp-list-table widefat fixed"><thead><tr><th>Question</th><th>Answer</th><th>Actions</th></tr></thead><tbody>';
            foreach ( $faqs as $f ) {
                echo '<tr><td><strong>' . esc_html( $f['question'] ) . '</strong></td><td>' . esc_html( wp_trim_words( $f['answer'], 20 ) ) . '</td><td><a href="' . get_edit_post_link( $f['id'] ) . '">Edit</a></td></tr>';
            }
            echo '</tbody></table>';
        }
        echo '</div>';
    }

    public function render_reviews_page() {
        echo '<div class="wrap asse-admin"><h1>⭐ Reviews</h1>';
        echo '<p>Reviews generate Review schema and feed into your AggregateRating for star snippets in search results.</p>';
        echo '<a href="' . admin_url( 'post-new.php?post_type=asse_review' ) . '" class="button button-primary">+ Add Review</a>';
        echo '<br><br>';

        $store = new ASSE_Data_Store();
        $reviews = $store->get_reviews();
        $agg = $store->get_aggregate_rating();
        if ( $agg ) {
            echo '<div class="asse-rating-summary"><span class="asse-rating-value">' . esc_html( $agg['ratingValue'] ) . '</span> / 5 (' . esc_html( $agg['reviewCount'] ) . ' reviews)</div>';
        }
        if ( empty( $reviews ) ) {
            echo '<p>No reviews yet. Add customer reviews to generate star rating schema.</p>';
        } else {
            echo '<table class="wp-list-table widefat fixed"><thead><tr><th>Author</th><th>Rating</th><th>Review</th><th>Actions</th></tr></thead><tbody>';
            foreach ( $reviews as $r ) {
                $stars = str_repeat( '★', (int) $r['rating'] ) . str_repeat( '☆', 5 - (int) $r['rating'] );
                echo '<tr><td>' . esc_html( $r['author'] ) . '</td><td>' . $stars . '</td><td>' . esc_html( wp_trim_words( $r['text'], 20 ) ) . '</td><td><a href="' . get_edit_post_link( $r['id'] ) . '">Edit</a></td></tr>';
            }
            echo '</tbody></table>';
        }
        echo '</div>';
    }

    public function render_team_page() {
        echo '<div class="wrap asse-admin"><h1>👥 Team</h1>';
        echo '<p>Team members generate Person schema for E-E-A-T signals. Add staff profiles with titles and specialties.</p>';
        echo '<a href="' . admin_url( 'post-new.php?post_type=asse_team' ) . '" class="button button-primary">+ Add Team Member</a>';
        echo '<br><br>';

        $store = new ASSE_Data_Store();
        $team = $store->get_team();
        if ( empty( $team ) ) {
            echo '<p>No team members yet. Add your staff to build E-E-A-T authority signals.</p>';
        } else {
            echo '<table class="wp-list-table widefat fixed"><thead><tr><th>Name</th><th>Title</th><th>Specialty</th><th>Actions</th></tr></thead><tbody>';
            foreach ( $team as $t ) {
                echo '<tr><td><strong>' . esc_html( $t['name'] ) . '</strong></td><td>' . esc_html( $t['title'] ) . '</td><td>' . esc_html( $t['specialty'] ) . '</td><td><a href="' . get_edit_post_link( $t['id'] ) . '">Edit</a></td></tr>';
            }
            echo '</tbody></table>';
        }
        echo '</div>';
    }

    public function render_preview_page() {
        $output = new ASSE_Schema_Output();
        // Force all schemas for preview
        echo '<div class="wrap asse-admin"><h1>🔍 Schema Preview</h1>';
        echo '<p>This is the JSON-LD output that will appear in your page head. Test it at <a href="https://search.google.com/test/rich-results" target="_blank">Google Rich Results Test</a> or <a href="https://validator.schema.org/" target="_blank">Schema.org Validator</a>.</p>';

        // Simulate output
        $reflection = new ReflectionClass( $output );
        $methods = [ 'get_local_business_schema', 'get_faq_schema', 'get_service_schema', 'get_review_schema', 'get_team_schema' ];
        foreach ( $methods as $method ) {
            if ( $reflection->hasMethod( $method ) ) {
                $m = $reflection->getMethod( $method );
                $m->setAccessible( true );
                $result = $m->invoke( $output );
                if ( $result ) {
                    $label = str_replace( 'get_', '', str_replace( '_schema', '', $method ) );
                    echo '<h3>' . esc_html( ucwords( str_replace( '_', ' ', $label ) ) ) . '</h3>';
                    echo '<pre style="background:#1a1a2e;color:#e0e0e0;padding:15px;border-radius:8px;overflow-x:auto;max-height:400px">' . esc_html( json_encode( $result, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) ) . '</pre>';
                }
            }
        }
        echo '</div>';
    }
}