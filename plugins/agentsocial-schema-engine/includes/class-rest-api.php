<?php
/**
 * ASSE REST API — Remote management endpoints for AgentSocial DFY service
 * 
 * All endpoints require authentication via WordPress application passwords.
 * Base: /wp-json/asse/v1/
 */
class ASSE_REST_API {

    private $namespace = 'asse/v1';

    public function register_routes() {
        // Business info
        register_rest_route( $this->namespace, '/business', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_business' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/business', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'update_business' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // FAQ
        register_rest_route( $this->namespace, '/faqs', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_faqs' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/faqs', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'create_faq' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/faqs/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [ $this, 'update_faq' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/faqs/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [ $this, 'delete_faq' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Services
        register_rest_route( $this->namespace, '/services', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_services' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/services', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'create_service' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/services/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [ $this, 'update_service' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/services/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [ $this, 'delete_service' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Reviews
        register_rest_route( $this->namespace, '/reviews', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_reviews' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/reviews', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'create_review' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/reviews/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [ $this, 'delete_review' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Team
        register_rest_route( $this->namespace, '/team', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_team' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/team', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'create_team_member' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/team/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [ $this, 'update_team_member' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
        register_rest_route( $this->namespace, '/team/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [ $this, 'delete_team_member' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Schema preview (GET — returns generated JSON-LD without auth for testing)
        register_rest_route( $this->namespace, '/schema-preview', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_schema_preview' ],
            'permission_callback' => '__return_true', // Public for testing
        ]);

        // Health check
        register_rest_route( $this->namespace, '/health', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'health_check' ],
            'permission_callback' => '__return_true',
        ]);

        // Theme Options - Read
        register_rest_route( $this->namespace, '/theme-options', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_theme_options' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Theme Options - Update
        register_rest_route( $this->namespace, '/theme-options', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'update_theme_options' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        // Read theme/plugin file
        register_rest_route( $this->namespace, '/read-file', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'read_file' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
    }

    public function check_permission() {
        return current_user_can( 'manage_options' );
    }

    // ---- Business ----

    public function get_business( $request ) {
        $fields = [
            'business_name', 'business_description', 'business_type',
            'street_address', 'city', 'state', 'postal_code', 'country',
            'phone', 'email', 'website', 'latitude', 'longitude',
            'price_range', 'image', 'logo', 'hours', 'same_as', 'enabled',
            'faq_enabled', 'services_enabled', 'reviews_enabled', 'team_enabled',
            'additional_type', 'alternate_names', 'google_rating', 'google_review_count',
            'additional_type', 'google_rating', 'google_review_count',
        ];
        $data = [];
        foreach ( $fields as $f ) {
            $data[ $f ] = get_option( 'asse_' . $f );
        }
        return rest_ensure_response( $data );
    }

    public function update_business( $request ) {
        $params = $request->get_json_params();
        if ( empty( $params ) ) {
            $params = $request->get_body_params();
        }

        $allowed = [
            'business_name', 'business_description', 'business_type',
            'street_address', 'city', 'state', 'postal_code', 'country',
            'phone', 'email', 'website', 'latitude', 'longitude',
            'price_range', 'image', 'logo', 'enabled',
            'faq_enabled', 'services_enabled', 'reviews_enabled', 'team_enabled',
            'additional_type', 'alternate_names', 'google_rating', 'google_review_count',
            'additional_type', 'google_rating', 'google_review_count',
        ];

        $updated = [];
        foreach ( $allowed as $field ) {
            if ( isset( $params[ $field ] ) ) {
                update_option( 'asse_' . $field, sanitize_text_field( $params[ $field ] ) );
                $updated[] = $field;
            }
        }

        // Hours (array)
        if ( isset( $params['hours'] ) && is_array( $params['hours'] ) ) {
            $clean = [];
            foreach ( $params['hours'] as $h ) {
                if ( ! empty( $h['days'] ) && ! empty( $h['open'] ) && ! empty( $h['close'] ) ) {
                    $clean[] = [
                        'days'  => array_map( 'sanitize_text_field', (array) $h['days'] ),
                        'open'  => sanitize_text_field( $h['open'] ),
                        'close' => sanitize_text_field( $h['close'] ),
                    ];
                }
            }
            update_option( 'asse_hours', $clean );
            $updated[] = 'hours';
        }

        // SameAs (array)
        if ( isset( $params['same_as'] ) && is_array( $params['same_as'] ) ) {
            update_option( 'asse_same_as', array_map( 'esc_url_raw', array_filter( $params['same_as'] ) ) );
            $updated[] = 'same_as';
        }

        // Alternate names (array)
        if ( isset( $params['alternate_names'] ) && is_array( $params['alternate_names'] ) ) {
            update_option( 'asse_alternate_names', array_map( 'sanitize_text_field', array_filter( $params['alternate_names'] ) ) );
            $updated[] = 'alternate_names';
        }

        return rest_ensure_response( [ 'updated' => $updated, 'status' => 'ok' ] );
    }

    // ---- FAQ ----

    public function get_faqs() {
        $store = new ASSE_Data_Store();
        return rest_ensure_response( $store->get_faqs() );
    }

    public function create_faq( $request ) {
        $params = $request->get_json_params() ?: $request->get_body_params();
        if ( empty( $params['question'] ) || empty( $params['answer'] ) ) {
            return new WP_Error( 'missing_fields', 'Question and answer are required', [ 'status' => 400 ] );
        }
        $id = wp_insert_post( [
            'post_type'    => 'asse_faq',
            'post_title'   => sanitize_text_field( $params['question'] ),
            'post_content' => wp_kses_post( $params['answer'] ),
            'post_status'  => 'publish',
        ]);
        return rest_ensure_response( [ 'id' => $id, 'question' => $params['question'], 'status' => 'created' ] );
    }

    public function update_faq( $request ) {
        $id = $request['id'];
        $params = $request->get_json_params() ?: $request->get_body_params();
        $update = [];
        if ( isset( $params['question'] ) ) $update['post_title'] = sanitize_text_field( $params['question'] );
        if ( isset( $params['answer'] ) ) $update['post_content'] = wp_kses_post( $params['answer'] );
        $update['ID'] = $id;
        wp_update_post( $update );
        return rest_ensure_response( [ 'id' => $id, 'status' => 'updated' ] );
    }

    public function delete_faq( $request ) {
        wp_delete_post( $request['id'], true );
        return rest_ensure_response( [ 'id' => $request['id'], 'status' => 'deleted' ] );
    }

    // ---- Services ----

    public function get_services() {
        $store = new ASSE_Data_Store();
        return rest_ensure_response( $store->get_services() );
    }

    public function create_service( $request ) {
        $params = $request->get_json_params() ?: $request->get_body_params();
        if ( empty( $params['name'] ) ) {
            return new WP_Error( 'missing_fields', 'Service name is required', [ 'status' => 400 ] );
        }
        $id = wp_insert_post( [
            'post_type'    => 'asse_service',
            'post_title'   => sanitize_text_field( $params['name'] ),
            'post_content' => wp_kses_post( $params['description'] ?? '' ),
            'post_status'  => 'publish',
        ]);
        if ( ! empty( $params['category'] ) ) {
            update_post_meta( $id, '_asse_service_category', sanitize_text_field( $params['category'] ) );
        }
        return rest_ensure_response( [ 'id' => $id, 'name' => $params['name'], 'status' => 'created' ] );
    }

    public function update_service( $request ) {
        $id = $request['id'];
        $params = $request->get_json_params() ?: $request->get_body_params();
        $update = [ 'ID' => $id ];
        if ( isset( $params['name'] ) ) $update['post_title'] = sanitize_text_field( $params['name'] );
        if ( isset( $params['description'] ) ) $update['post_content'] = wp_kses_post( $params['description'] );
        wp_update_post( $update );
        if ( isset( $params['category'] ) ) {
            update_post_meta( $id, '_asse_service_category', sanitize_text_field( $params['category'] ) );
        }
        return rest_ensure_response( [ 'id' => $id, 'status' => 'updated' ] );
    }

    public function delete_service( $request ) {
        wp_delete_post( $request['id'], true );
        return rest_ensure_response( [ 'id' => $request['id'], 'status' => 'deleted' ] );
    }

    // ---- Reviews ----

    public function get_reviews() {
        $store = new ASSE_Data_Store();
        return rest_ensure_response( $store->get_reviews() );
    }

    public function create_review( $request ) {
        $params = $request->get_json_params() ?: $request->get_body_params();
        if ( empty( $params['text'] ) ) {
            return new WP_Error( 'missing_fields', 'Review text is required', [ 'status' => 400 ] );
        }
        $id = wp_insert_post( [
            'post_type'    => 'asse_review',
            'post_title'   => sanitize_text_field( $params['author'] ?? 'Anonymous' ),
            'post_content' => wp_kses_post( $params['text'] ),
            'post_status'  => 'publish',
        ]);
        update_post_meta( $id, '_asse_review_rating', absint( $params['rating'] ?? 5 ) );
        update_post_meta( $id, '_asse_review_author', sanitize_text_field( $params['author'] ?? 'Anonymous' ) );
        if ( ! empty( $params['date'] ) ) {
            update_post_meta( $id, '_asse_review_date', sanitize_text_field( $params['date'] ) );
        }
        return rest_ensure_response( [ 'id' => $id, 'status' => 'created' ] );
    }

    public function delete_review( $request ) {
        wp_delete_post( $request['id'], true );
        return rest_ensure_response( [ 'id' => $request['id'], 'status' => 'deleted' ] );
    }

    // ---- Team ----

    public function get_team() {
        $store = new ASSE_Data_Store();
        return rest_ensure_response( $store->get_team() );
    }

    public function create_team_member( $request ) {
        $params = $request->get_json_params() ?: $request->get_body_params();
        if ( empty( $params['name'] ) ) {
            return new WP_Error( 'missing_fields', 'Team member name is required', [ 'status' => 400 ] );
        }
        $id = wp_insert_post( [
            'post_type'    => 'asse_team',
            'post_title'   => sanitize_text_field( $params['name'] ),
            'post_content' => wp_kses_post( $params['bio'] ?? '' ),
            'post_status'  => 'publish',
        ]);
        if ( ! empty( $params['title'] ) ) {
            update_post_meta( $id, '_asse_team_title', sanitize_text_field( $params['title'] ) );
        }
        if ( ! empty( $params['specialty'] ) ) {
            update_post_meta( $id, '_asse_team_specialty', sanitize_text_field( $params['specialty'] ) );
        }
        return rest_ensure_response( [ 'id' => $id, 'name' => $params['name'], 'status' => 'created' ] );
    }

    public function update_team_member( $request ) {
        $id = $request['id'];
        $params = $request->get_json_params() ?: $request->get_body_params();
        $update = [ 'ID' => $id ];
        if ( isset( $params['name'] ) ) $update['post_title'] = sanitize_text_field( $params['name'] );
        if ( isset( $params['bio'] ) ) $update['post_content'] = wp_kses_post( $params['bio'] );
        wp_update_post( $update );
        if ( isset( $params['title'] ) ) update_post_meta( $id, '_asse_team_title', sanitize_text_field( $params['title'] ) );
        if ( isset( $params['specialty'] ) ) update_post_meta( $id, '_asse_team_specialty', sanitize_text_field( $params['specialty'] ) );
        return rest_ensure_response( [ 'id' => $id, 'status' => 'updated' ] );
    }

    public function delete_team_member( $request ) {
        wp_delete_post( $request['id'], true );
        return rest_ensure_response( [ 'id' => $request['id'], 'status' => 'deleted' ] );
    }

    // ---- Schema Preview ----

    public function get_schema_preview() {
        $output = new ASSE_Schema_Output();
        $reflection = new ReflectionClass( $output );
        $schemas = [];
        $methods = [
            'local_business' => 'get_local_business_schema',
            'faq'           => 'get_faq_schema',
            'service'       => 'get_service_schema',
            'review'        => 'get_review_schema',
            'team'          => 'get_team_schema',
        ];
        foreach ( $methods as $key => $method ) {
            if ( $reflection->hasMethod( $method ) ) {
                $m = $reflection->getMethod( $method );
                $m->setAccessible( true );
                $result = $m->invoke( $output );
                if ( $result ) {
                    $schemas[ $key ] = $result;
                }
            }
        }
        return rest_ensure_response( $schemas );
    }

    // ---- Health Check ----

    public function health_check() {
        return rest_ensure_response( [
            'plugin'  => 'AgentSocial Schema Engine',
            'version' => ASSE_VERSION,
            'status'  => 'active',
            'enabled' => (bool) get_option( 'asse_enabled', '1' ),
        ]);
    }

    // ---- Theme Options ----

    public function get_theme_options( $request ) {
        $keys = $request->get_param( 'keys' );
        $search = $request->get_param( 'search' );

        $result = [];

        if ( $keys ) {
            // Read specific option keys
            $key_list = is_array( $keys ) ? $keys : explode( ',', $keys );
            foreach ( $key_list as $key ) {
                $key = trim( $key );
                $val = get_option( $key );
                if ( $val !== false ) {
                    $result[ $key ] = $val;
                }
                // Also check theme mods
                $mod_val = get_theme_mod( $key );
                if ( $mod_val !== false ) {
                    $result[ 'theme_mod_' . $key ] = $mod_val;
                }
            }
        }

        if ( $search ) {
            // Search for option keys matching a pattern
            global $wpdb;
            $like = '%' . $wpdb->esc_like( $search ) . '%';
            $rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s LIMIT 50",
                $like
            ) );
            foreach ( $rows as $row ) {
                $val = maybe_unserialize( $row->option_value );
                // Truncate large values
                if ( is_array( $val ) ) {
                    $result[ $row->option_name ] = '[array with ' . count( $val ) . ' keys: ' . implode( ', ', array_slice( array_keys( $val ), 0, 20 ) ) . ']';
                } elseif ( is_string( $val ) && strlen( $val ) > 500 ) {
                    $result[ $row->option_name ] = substr( $val, 0, 500 ) . '...';
                } else {
                    $result[ $row->option_name ] = $val;
                }
            }
        }

        // If no params, return H-Code relevant options
        if ( empty( $keys ) && empty( $search ) ) {
            $hcode_keys = [
                'hcode_theme_options',
                'theme_mods_h-code',
                'theme_mods_h-code-child',
                'hcode_product_feature_layout',
                'hcode_shop_feature_layout',
                'stylesheet',
                'template',
                'current_theme',
            ];
            foreach ( $hcode_keys as $key ) {
                $val = get_option( $key );
                if ( $val !== false ) {
                    if ( is_array( $val ) ) {
                        // Find feature/layout related keys
                        $filtered = [];
                        foreach ( $val as $k => $v ) {
                            if ( is_string( $v ) && strlen( $v ) < 200 ) {
                                $filtered[ $k ] = $v;
                            } elseif ( is_array( $v ) ) {
                                $filtered[ $k ] = '[array: ' . count( $v ) . ' items]';
                            } else {
                                $filtered[ $k ] = $v;
                            }
                        }
                        $result[ $key ] = $filtered;
                    } else {
                        $result[ $key ] = $val;
                    }
                }
            }

            // Also get theme mods
            $theme_mods = get_theme_mods();
            if ( $theme_mods ) {
                $filtered = [];
                foreach ( $theme_mods as $k => $v ) {
                    if ( is_string( $v ) && strlen( $v ) < 200 ) {
                        $filtered[ $k ] = $v;
                    } elseif ( is_array( $v ) ) {
                        $filtered[ $k ] = '[array: ' . count( $v ) . ' items]';
                    } else {
                        $filtered[ $k ] = $v;
                    }
                }
                $result['theme_mods_all'] = $filtered;
            }
        }

        return rest_ensure_response( $result );
    }



    public function read_file( $request ) {
        $path = $request->get_param( 'path' );
        if ( empty( $path ) ) {
            return new WP_Error( 'missing_path', 'path param required (relative to ABSPATH, e.g. wp-content/themes/h-code-child/functions.php)', [ 'status' => 400 ] );
        }
        $allowed_dirs = [ 'wp-content/themes/', 'wp-content/plugins/' ];
        $full_path = ABSPATH . $path;
        $real = realpath( $full_path );
        if ( ! $real ) {
            return new WP_Error( 'not_found', 'File not found: ' . $path, [ 'status' => 404 ] );
        }
        $allowed = false;
        foreach ( $allowed_dirs as $dir ) {
            if ( strpos( $real, realpath( ABSPATH . $dir ) ) === 0 ) {
                $allowed = true;
                break;
            }
        }
        if ( ! $allowed ) {
            return new WP_Error( 'forbidden', 'Only theme/plugin files allowed', [ 'status' => 403 ] );
        }
        if ( ! is_readable( $real ) ) {
            return new WP_Error( 'not_readable', 'File not readable', [ 'status' => 403 ] );
        }
        $content = file_get_contents( $real );
        return rest_ensure_response( [
            'path'      => $path,
            'real_path' => $real,
            'size'      => strlen( $content ),
            'content'   => $content,
        ] );
    }

    public function update_theme_options( $request ) {
        $key   = $request->get_param( 'key' );
        $value = $request->get_param( 'value' );
        $type  = $request->get_param( 'type' ); // 'option' or 'theme_mod'

        if ( empty( $key ) ) {
            return new WP_Error( 'missing_key', 'Option key is required', [ 'status' => 400 ] );
        }

        if ( $type === 'theme_mod' ) {
            set_theme_mod( $key, $value );
        } else {
            update_option( $key, $value );
        }

        return rest_ensure_response( [
            'status'  => 'updated',
            'key'     => $key,
            'value'   => $value,
            'type'    => $type ?: 'option',
        ]);
    }
}
