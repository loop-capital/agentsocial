<?php
/**
 * ASSE AI Discovery — Makes the site discoverable by AI agents
 * 
 * Adds: robots.txt rules, Link headers, markdown negotiation,
 * /.well-known/ endpoints (api-catalog, mcp server-card, agent-skills)
 */
class ASSE_AI_Discovery {

    private $site_url;
    private $plugin_version;

    public function __construct() {
        $this->site_url = home_url();
        $this->plugin_version = ASSE_VERSION;
    }

    /**
     * Register all hooks
     */
    public function register() {
        // 1. robots.txt — AI crawler rules + Content Signals
        add_filter( 'robots_txt', [ $this, 'filter_robots_txt' ], 10, 2 );

        // 2. Link headers (RFC 8288) — API discovery
        add_action( 'send_headers', [ $this, 'add_link_headers' ] );

        // 3. Markdown negotiation — text/markdown for AI agents
        add_action( 'template_redirect', [ $this, 'handle_markdown_negotiation' ], 0 );

        // 4. /.well-known/ routes — using parse_request for reliability
        add_action( 'init', [ $this, 'add_rewrite_rules' ] );
        add_filter( 'query_vars', [ $this, 'register_query_vars' ] );
        add_action( 'parse_request', [ $this, 'handle_well_known' ] );

        // 5. Admin settings link
        add_filter( 'plugin_action_links_' . ASSE_PLUGIN_BASENAME, [ $this, 'add_settings_link' ] );
    }

    // ============================================================
    // 1. robots.txt — AI Crawler Rules + Content Signals
    // ============================================================

    /**
     * Append AI-specific bot rules and Content Signals to robots.txt
     */
    public function filter_robots_txt( $output, $public ) {
        // Content Signals — declare AI content usage preferences
        $output .= "\n# AI Content Signals (https://contentsignals.org/)\n";
        $output .= "Content-Signal: ai-train=no, search=yes, ai-input=no\n\n";

        // AI crawlers — allow indexing/discovery, deny training
        $output .= "# AI Crawlers — Allow discovery, deny training\n";
        $ai_bots = [
            'GPTBot'         => '/',   // OpenAI
            'OAI-SearchBot'  => '/',   // OpenAI Search
            'ChatGPT-User'   => '/',   // ChatGPT user-facing
            'Claude-Web'     => '/',   // Anthropic
            'Google-Extended' => '/',   // Google AI training
            'Bytespider'     => '/',    // ByteDance / TikTok
            'CCBot'          => '/',    // Common Crawl
            'PerplexityBot'  => '/',    // Perplexity
            'YouBot'         => '/',    // You.com
            'KagiBot'        => '/',    // Kagi
        ];

        // Allow all listed bots for search/discovery
        foreach ( $ai_bots as $bot => $path ) {
            $output .= "User-agent: {$bot}\n";
            $output .= "Allow: {$path}\n";
            // Block training-specific paths
            $output .= "Disallow: /wp-admin/\n";
            $output .= "Disallow: /wp-json/asse/v1/\n\n";
        }

        // Explicitly deny AI training on content
        $output .= "# Deny AI training crawlers\n";
        $deny_bots = [ 'AI2Bot', 'Applebot-Extended', 'FacebookBot', 'ImagesiftBot', 'Diffbot' ];
        foreach ( $deny_bots as $bot ) {
            $output .= "User-agent: {$bot}\n";
            $output .= "Disallow: /\n\n";
        }

        // Wildcard catch-all — allow by default, block admin
        $output .= "# Default rules\n";
        $output .= "User-agent: *\n";
        $output .= "Allow: /\n";
        $output .= "Disallow: /wp-admin/\n";
        $output .= "Disallow: /wp-json/asse/v1/\n";
        $output .= "Allow: /wp-admin/admin-ajax.php\n";
        $output .= "Allow: /.well-known/\n\n";

        // Sitemap reference
        $output .= "# Sitemaps\n";
        $output .= "Sitemap: " . home_url( '/sitemap.xml' ) . "\n";

        return $output;
    }

    // ============================================================
    // 2. Link Headers (RFC 8288) — API Discovery
    // ============================================================

    /**
     * Add Link headers to frontend responses for agent discovery
     */
    public function add_link_headers() {
        if ( is_admin() || wp_is_json_request() ) {
            return;
        }

        $links = [];

        // API catalog
        $links[] = '</.well-known/api-catalog>; rel="service-desc"; type="application/linkset+json"';
        $links[] = '</.well-known/api-catalog>; rel="api-catalog"';

        // Schema preview (JSON-LD)
        $links[] = '</wp-json/asse/v1/schema-preview>; rel="describedby"; type="application/ld+json"';

        // MCP server card
        $links[] = '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"';

        // Agent skills
        $links[] = '</.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"';

        // Health check
        $links[] = '</wp-json/asse/v1/health>; rel="status"';

        // Documentation
        $links[] = '</.well-known/agent-skills/index.json>; rel="service-doc"';

        if ( ! empty( $links ) ) {
            header( 'Link: ' . implode( ', ', $links ) );
        }
    }

    // ============================================================
    // 3. Markdown Negotiation — Accept: text/markdown
    // ============================================================

    /**
     * If the client sends Accept: text/markdown, serve a markdown
     * representation of the page content instead of HTML.
     */
    public function handle_markdown_negotiation() {
        if ( is_admin() || is_feed() || is_404() ) {
            return;
        }

        $accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? $_SERVER['HTTP_ACCEPT'] : '';
        
        // Check if client prefers markdown
        if ( strpos( $accept, 'text/markdown' ) === false ) {
            return;
        }

        // Quality check — only serve markdown if text/markdown is preferred
        // or equally preferred over text/html
        if ( ! $this->prefers_markdown( $accept ) ) {
            return;
        }

        // Generate markdown version
        $markdown = $this->generate_markdown();

        if ( $markdown ) {
            header( 'Content-Type: text/markdown; charset=utf-8' );
            header( 'X-Markdown-Tokens: ' . str_word_count( strip_tags( $markdown ) ) );
            echo $markdown;
            exit;
        }
    }

    /**
     * Parse Accept header to determine if markdown is preferred
     */
    private function prefers_markdown( $accept ) {
        $types = [];
        $parts = explode( ',', $accept );
        foreach ( $parts as $part ) {
            $part = trim( $part );
            if ( strpos( $part, ';q=' ) !== false ) {
                list( $type, $q ) = explode( ';q=', $part, 2 );
                $types[ trim( $type ) ] = (float) $q;
            } else {
                $types[ trim( $part ) ] = 1.0;
            }
        }

        $md_q = isset( $types['text/markdown'] ) ? $types['text/markdown'] : 0;
        $html_q = isset( $types['text/html'] ) ? $types['text/html'] : 1;

        return $md_q >= $html_q;
    }

    /**
     * Generate markdown from current page content + schema data
     */
    private function generate_markdown() {
        $business_name = get_option( 'asse_business_name' );
        $business_desc = get_option( 'asse_business_description' );
        $phone = get_option( 'asse_phone' );
        $email = get_option( 'asse_email' );
        $address = trim( implode( ' ', array_filter( [
            get_option( 'asse_street_address' ),
            get_option( 'asse_city' ),
            get_option( 'asse_state' ),
            get_option( 'asse_postal_code' ),
        ] ) ) );

        if ( empty( $business_name ) ) {
            return null;
        }

        $md = "# {$business_name}\n\n";

        if ( $business_desc ) {
            $md .= "{$business_desc}\n\n";
        }

        // Contact info
        $md .= "## Contact\n\n";
        if ( $phone ) $md .= "- **Phone:** {$phone}\n";
        if ( $email ) $md .= "- **Email:** {$email}\n";
        if ( $address ) $md .= "- **Address:** {$address}\n";
        $md .= "- **Website:** " . home_url() . "\n\n";

        // Hours
        $hours = get_option( 'asse_hours', [] );
        if ( ! empty( $hours ) && is_array( $hours ) ) {
            $md .= "## Hours\n\n";
            foreach ( $hours as $h ) {
                if ( ! empty( $h['days'] ) && ! empty( $h['open'] ) && ! empty( $h['close'] ) ) {
                    $days = is_array( $h['days'] ) ? implode( ', ', $h['days'] ) : $h['days'];
                    $md .= "- **{$days}:** {$h['open']} – {$h['close']}\n";
                }
            }
            $md .= "\n";
        }

        // Services
        $store = new ASSE_Data_Store();
        $services = $store->get_services();
        if ( ! empty( $services ) ) {
            $md .= "## Services\n\n";
            $grouped = [];
            foreach ( $services as $s ) {
                $cat = $s['category'] ?: 'General';
                if ( ! isset( $grouped[ $cat ] ) ) $grouped[ $cat ] = [];
                $grouped[ $cat ][] = $s;
            }
            foreach ( $grouped as $cat => $items ) {
                $md .= "### {$cat}\n\n";
                foreach ( $items as $s ) {
                    $md .= "- **{$s['name']}**";
                    if ( ! empty( $s['description'] ) ) {
                        $md .= " — {$s['description']}";
                    }
                    $md .= "\n";
                }
                $md .= "\n";
            }
        }

        // FAQ
        $faqs = $store->get_faqs();
        if ( ! empty( $faqs ) ) {
            $md .= "## FAQ\n\n";
            foreach ( $faqs as $faq ) {
                $md .= "**Q: {$faq['question']}**\n\n";
                $md .= "A: {$faq['answer']}\n\n";
            }
        }

        // Team
        $team = $store->get_team();
        if ( ! empty( $team ) ) {
            $md .= "## Our Team\n\n";
            foreach ( $team as $member ) {
                $md .= "- **{$member['name']}**";
                if ( $member['title'] ) $md .= ", {$member['title']}";
                if ( $member['specialty'] ) $md .= " — *{$member['specialty']}*";
                $md .= "\n";
            }
            $md .= "\n";
        }

        // Reviews summary
        $reviews = $store->get_reviews();
        $agg = $store->get_aggregate_rating();
        if ( $agg ) {
            $md .= "## Reviews\n\n";
            $md .= "**Rating:** {$agg['ratingValue']}/5 ({$agg['reviewCount']} reviews)\n\n";
            foreach ( array_slice( $reviews, 0, 5 ) as $r ) {
                $stars = str_repeat( '★', (int) $r['rating'] ) . str_repeat( '☆', 5 - (int) $r['rating'] );
                $md .= "> {$stars} — *{$r['author']}*\n> {$r['text']}\n\n";
            }
        }

        // Social links
        $same_as = get_option( 'asse_same_as', [] );
        if ( ! empty( $same_as ) && is_array( $same_as ) ) {
            $md .= "## Social\n\n";
            foreach ( $same_as as $url ) {
                $md .= "- {$url}\n";
            }
            $md .= "\n";
        }

        $md .= "---\n*Generated by AgentSocial Schema Engine v{$this->plugin_version}*\n";

        return $md;
    }

    // ============================================================
    // 4. /.well-known/ Endpoints
    // ============================================================

    /**
     * Add rewrite rules for /.well-known/ paths
     */
    public function add_rewrite_rules() {
        // API Catalog
        add_rewrite_rule(
            '^\.well-known/api-catalog/?$',
            'index.php?asse_well_known=api-catalog',
            'top'
        );

        // MCP Server Card
        add_rewrite_rule(
            '^\.well-known/mcp/server-card\.json/?$',
            'index.php?asse_well_known=mcp-server-card',
            'top'
        );

        // Agent Skills Index
        add_rewrite_rule(
            '^\.well-known/agent-skills/index\.json/?$',
            'index.php?asse_well_known=agent-skills',
            'top'
        );

        // Markdown representation
        add_rewrite_rule(
            '^\.well-known/markdown/?$',
            'index.php?asse_well_known=markdown',
            'top'
        );
    }

    /**
     * Register query vars
     */
    public function register_query_vars( $vars ) {
        $vars[] = 'asse_well_known';
        return $vars;
    }

    /**
     * Handle /.well-known/ requests via parse_request
     * This fires early and bypasses theme 404 handling
     */
    public function handle_well_known( $wp ) {
        // Check query var from rewrite rules
        if ( isset( $wp->query_vars['asse_well_known'] ) ) {
            $endpoint = $wp->query_vars['asse_well_known'];
        } else {
            // Also check REQUEST_URI directly as fallback
            $request = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
            $request = trim( $request, '/' );
            $well_known_endpoints = [
                '.well-known/api-catalog'    => 'api-catalog',
                '.well-known/mcp/server-card.json' => 'mcp-server-card',
                '.well-known/agent-skills/index.json' => 'agent-skills',
                '.well-known/markdown'        => 'markdown',
            ];
            if ( ! isset( $well_known_endpoints[ $request ] ) ) {
                return; // Not a well-known request, let WordPress handle it
            }
            $endpoint = $well_known_endpoints[ $request ];
        }

        switch ( $endpoint ) {
            case 'api-catalog':
                $this->serve_api_catalog();
                break;
            case 'mcp-server-card':
                $this->serve_mcp_server_card();
                break;
            case 'agent-skills':
                $this->serve_agent_skills();
                break;
            case 'markdown':
                $this->serve_markdown_endpoint();
                break;
            default:
                status_header( 404 );
                echo json_encode( [ 'error' => 'Not found' ] );
                break;
        }
        exit;
    }

    /**
     * /.well-known/api-catalog — RFC 9727 linkset+json
     */
    private function serve_api_catalog() {
        $home = home_url();
        $rest = rest_url( 'asse/v1/' );

        $catalog = [
            'linkset' => [
                [
                    'anchor' => $home,
                    'links' => [
                        // Schema Engine API
                        [
                            'href'          => $rest . 'business',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'Business Information API',
                            'description'  => 'Read and update local business schema data',
                        ],
                        [
                            'href'          => $rest . 'services',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'Services API',
                            'description'  => 'List, create, update, and delete services',
                        ],
                        [
                            'href'          => $rest . 'faqs',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'FAQ API',
                            'description'  => 'Manage FAQ items for schema markup',
                        ],
                        [
                            'href'          => $rest . 'reviews',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'Reviews API',
                            'description'  => 'List, create, and delete customer reviews',
                        ],
                        [
                            'href'          => $rest . 'team',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'Team API',
                            'description'  => 'Manage team member profiles',
                        ],
                        [
                            'href'          => $rest . 'schema-preview',
                            'rel'           => [ 'describedby' ],
                            'type'          => 'application/ld+json',
                            'title'         => 'Schema Preview',
                            'description'  => 'Complete JSON-LD schema output for this business',
                        ],
                        [
                            'href'          => $rest . 'health',
                            'rel'           => [ 'status' ],
                            'type'          => 'application/json',
                            'title'         => 'Health Check',
                            'description'  => 'Plugin health and status endpoint',
                        ],
                        // Well-known discovery
                        [
                            'href'          => $home . '/.well-known/mcp/server-card.json',
                            'rel'           => [ 'service-desc' ],
                            'type'          => 'application/json',
                            'title'         => 'MCP Server Card',
                            'description'  => 'Model Context Protocol server card for AI agent discovery',
                        ],
                        [
                            'href'          => $home . '/.well-known/agent-skills/index.json',
                            'rel'           => [ 'service-doc' ],
                            'type'          => 'application/json',
                            'title'         => 'Agent Skills Index',
                            'description'  => 'Discoverable capabilities for AI agents',
                        ],
                        [
                            'href'          => $home . '/.well-known/markdown',
                            'rel'           => [ 'alternate' ],
                            'type'          => 'text/markdown',
                            'title'         => 'Markdown Representation',
                            'description'  => 'Markdown version of business information for AI agents',
                        ],
                    ],
                ],
            ],
        ];

        $this->json_response( $catalog, 'application/linkset+json' );
    }

    /**
     * /.well-known/mcp/server-card.json — MCP Server Card (SEP-1649)
     */
    private function serve_mcp_server_card() {
        $home = home_url();
        $rest = rest_url( 'asse/v1/' );
        $name = get_option( 'asse_business_name', 'Local Business' );

        $card = [
            '$schema'    => 'https://schema.modelcontextprotocol.org/server-card/v1',
            'serverInfo' => [
                'name'    => $name . ' — AgentSocial',
                'version' => $this->plugin_version,
                'description' => 'Local business schema and booking API for ' . $name,
            ],
            'transport' => [
                'type'    => 'https',
                'url'     => $rest,
                'headers' => [
                    'Authorization' => 'Bearer {api_key}',
                ],
            ],
            'capabilities' => [
                'tools' => [
                    [
                        'name'        => 'get_business_info',
                        'description' => 'Get local business information including name, address, hours, and contact details',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'get_services',
                        'description' => 'List all services offered by the business',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'get_faqs',
                        'description' => 'Get frequently asked questions about the business',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'get_team',
                        'description' => 'Get team member profiles and specialties',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'get_reviews',
                        'description' => 'Get customer reviews and ratings',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'get_schema',
                        'description' => 'Get complete JSON-LD schema markup for the business',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => new \stdClass(),
                        ],
                    ],
                    [
                        'name'        => 'check_availability',
                        'description' => 'Check service availability for booking',
                        'inputSchema' => [
                            'type'  => 'object',
                            'properties' => [
                                'service' => [ 'type' => 'string', 'description' => 'Service name or ID' ],
                                'date'    => [ 'type' => 'string', 'description' => 'Date in YYYY-MM-DD format' ],
                                'staff'   => [ 'type' => 'string', 'description' => 'Staff member name or ID (optional)' ],
                            ],
                        ],
                    ],
                ],
            ],
            'metadata' => [
                'business_type' => get_option( 'asse_business_type', 'SalonOrSpa' ),
                'location'      => trim( implode( ', ', array_filter( [
                    get_option( 'asse_city' ),
                    get_option( 'asse_state' ),
                ] ) ) ),
                'website'       => $home,
            ],
        ];

        $this->json_response( $card );
    }

    /**
     * /.well-known/agent-skills/index.json — Agent Skills Discovery (RFC v0.2.0)
     */
    private function serve_agent_skills() {
        $home = home_url();
        $name = get_option( 'asse_business_name', 'Local Business' );

        // Compute sha256 of each skill definition
        $skills = [
            [
                'name'        => 'get-business-info',
                'type'        => 'api',
                'description' => 'Retrieve complete business information including name, address, phone, hours, and social links',
                'url'         => $home . '/.well-known/agent-skills/get-business-info.json',
            ],
            [
                'name'        => 'get-services',
                'type'        => 'api',
                'description' => 'List all services offered by ' . $name . ' with categories and descriptions',
                'url'         => $home . '/.well-known/agent-skills/get-services.json',
            ],
            [
                'name'        => 'get-faqs',
                'type'        => 'api',
                'description' => 'Get frequently asked questions and answers about ' . $name,
                'url'         => $home . '/.well-known/agent-skills/get-faqs.json',
            ],
            [
                'name'        => 'get-reviews',
                'type'        => 'api',
                'description' => 'Get customer reviews and aggregate rating for ' . $name,
                'url'         => $home . '/.well-known/agent-skills/get-reviews.json',
            ],
            [
                'name'        => 'get-team',
                'type'        => 'api',
                'description' => 'Get team member profiles, specialties, and bios',
                'url'         => $home . '/.well-known/agent-skills/get-team.json',
            ],
            [
                'name'        => 'get-schema',
                'type'        => 'api',
                'description' => 'Get complete JSON-LD structured data (schema.org) for SEO and AI search',
                'url'         => $home . '/.well-known/agent-skills/get-schema.json',
            ],
            [
                'name'        => 'check-availability',
                'type'        => 'api',
                'description' => 'Check service availability for a given date, optionally filtered by service or staff',
                'url'         => $home . '/.well-known/agent-skills/check-availability.json',
            ],
            [
                'name'        => 'book-appointment',
                'type'        => 'api',
                'description' => 'Book an appointment for a service with a specific team member',
                'url'         => $home . '/.well-known/agent-skills/book-appointment.json',
            ],
        ];

        // Add sha256 digests
        foreach ( $skills as &$skill ) {
            $skill['sha256'] = hash( 'sha256', wp_json_encode( $skill ) );
        }

        $index = [
            '$schema'   => 'https://agentskills.io/schema/index/v0.2.0',
            'name'      => $name,
            'url'       => $home,
            'skills'    => $skills,
        ];

        $this->json_response( $index );
    }

    /**
     * /.well-known/markdown — Direct markdown endpoint
     */
    private function serve_markdown_endpoint() {
        $md = $this->generate_markdown();
        if ( $md ) {
            header( 'Content-Type: text/markdown; charset=utf-8' );
            header( 'X-Markdown-Tokens: ' . str_word_count( strip_tags( $md ) ) );
            echo $md;
            exit;
        }
        status_header( 404 );
        echo '# Not Found\nBusiness information not available.';
        exit;
    }

    /**
     * Output JSON response with proper headers
     */
    private function json_response( $data, $content_type = 'application/json' ) {
        header( 'Content-Type: ' . $content_type . '; charset=utf-8' );
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
        header( 'Cache-Control: public, max-age=3600' );
        echo wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
    }

    /**
     * Add settings link on plugins page
     */
    public function add_settings_link( $links ) {
        $settings = '<a href="' . admin_url( 'admin.php?page=asse-settings' ) . '">' . __( 'Settings' ) . '</a>';
        array_unshift( $links, $settings );
        return $links;
    }
}