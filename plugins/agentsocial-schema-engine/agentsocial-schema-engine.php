<?php
/**
 * Plugin Name: AgentSocial Schema Engine
 * Plugin URI: https://agentsocial.ai
 * Description: Comprehensive schema markup engine for local businesses. Generates LocalBusiness, FAQ, Service, Review, and Team schema with remote API management.
 * Version: 1.2.0
 * Author: AgentSocial
 * Author URI: https://agentsocial.ai
 * License: Proprietary
 * Text Domain: agentsocial-schema
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ASSE_VERSION', '1.2.0' );
define( 'ASSE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ASSE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'ASSE_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Load includes
require_once ASSE_PLUGIN_DIR . 'includes/class-schema-output.php';
require_once ASSE_PLUGIN_DIR . 'includes/class-admin-settings.php';
require_once ASSE_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once ASSE_PLUGIN_DIR . 'includes/class-data-store.php';
require_once ASSE_PLUGIN_DIR . 'includes/class-ai-discovery.php';

// Activation hook — set default options
register_activation_hook( __FILE__, function() {
    $defaults = [
        'asse_business_name'        => '',
        'asse_business_description' => '',
        'asse_business_type'       => 'SalonOrSpa',
        'asse_street_address'      => '',
        'asse_city'                => '',
        'asse_state'               => '',
        'asse_postal_code'         => '',
        'asse_country'             => 'US',
        'asse_phone'               => '',
        'asse_email'               => '',
        'asse_website'             => '',
        'asse_latitude'            => '',
        'asse_longitude'           => '',
        'asse_price_range'         => '$$$',
        'asse_hours'               => [],
        'asse_same_as'             => [],
        'asse_image'               => '',
        'asse_logo'                => '',
        'asse_faq_items'           => [],
        'asse_services'            => [],
        'asse_reviews'             => [],
        'asse_team'                => [],
        'asse_enabled'            => '1',
        'asse_faq_enabled'        => '1',
        'asse_services_enabled'   => '1',
        'asse_reviews_enabled'    => '1',
        'asse_team_enabled'       => '1',
    ];

    foreach ( $defaults as $key => $value ) {
        if ( false === get_option( $key ) ) {
            add_option( $key, $value );
        }
    }

    // Register custom post types for services, FAQ, reviews, team
    $store = new ASSE_Data_Store();
    $store->register_post_types();

    // Add /.well-known/ rewrite rules
    $discovery = new ASSE_AI_Discovery();
    $discovery->add_rewrite_rules();
    flush_rewrite_rules();
} );

// Deactivation
register_deactivation_hook( __FILE__, function() {
    flush_rewrite_rules();
} );

// Initialize
add_action( 'plugins_loaded', function() {
    // Data store (post types)
    $store = new ASSE_Data_Store();
    add_action( 'init', [ $store, 'register_post_types' ] );

    // Schema output
    $output = new ASSE_Schema_Output();
    add_action( 'wp_head', [ $output, 'output_schema' ], 99 );

    // Admin settings
    if ( is_admin() ) {
        $admin = new ASSE_Admin_Settings();
        add_action( 'admin_menu', [ $admin, 'add_menu_pages' ] );
        add_action( 'admin_enqueue_scripts', [ $admin, 'enqueue_assets' ] );
        add_action( 'admin_init', [ $admin, 'register_settings' ] );
    }

    // REST API
    $rest = new ASSE_REST_API();
    add_action( 'rest_api_init', [ $rest, 'register_routes' ] );

    // AI Discovery (robots.txt, Link headers, markdown, /.well-known/)
    $discovery = new ASSE_AI_Discovery();
    $discovery->register();
} );