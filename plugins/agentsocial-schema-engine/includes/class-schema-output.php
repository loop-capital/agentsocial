<?php
/**
 * ASSE Schema Output — Generates JSON-LD for front-end pages
 */
class ASSE_Schema_Output {

    private $store;

    public function __construct() {
        $this->store = new ASSE_Data_Store();
    }

    /**
     * Main output — hooked to wp_head
     */
    public function output_schema() {
        if ( is_admin() || ! get_option( 'asse_enabled', '1' ) ) {
            return;
        }

        $schemas = [];

        // LocalBusiness schema (homepage only by default)
        if ( is_front_page() || is_home() ) {
            $local = $this->get_local_business_schema();
            if ( $local ) {
                $schemas[] = $local;
            }
        }

        // FAQ schema (any page that has FAQ)
        if ( get_option( 'asse_faq_enabled', '1' ) ) {
            $faq = $this->get_faq_schema();
            if ( $faq ) {
                $schemas[] = $faq;
            }
        }

        // Service schema
        if ( get_option( 'asse_services_enabled', '1' ) ) {
            $services = $this->get_service_schema();
            if ( $services ) {
                $schemas[] = $services;
            }
        }

        // Review schema (homepage)
        if ( ( is_front_page() || is_home() ) && get_option( 'asse_reviews_enabled', '1' ) ) {
            $reviews = $this->get_review_schema();
            if ( $reviews ) {
                $schemas[] = $reviews;
            }
        }

        // Team/Person schema
        if ( get_option( 'asse_team_enabled', '1' ) ) {
            $team = $this->get_team_schema();
            if ( $team ) {
                $schemas = array_merge( $schemas, $team );
            }
        }

        // Output each schema block
        foreach ( $schemas as $schema ) {
            echo "\n<!-- AgentSocial Schema Engine -->\n";
            echo '<script type="application/ld+json">' . "\n";
            echo wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
            echo "\n</script>\n";
        }
    }

    /**
     * LocalBusiness schema
     */
    private function get_local_business_schema() {
        $name = get_option( 'asse_business_name' );
        if ( empty( $name ) ) {
            return null;
        }

        $business_type = get_option( 'asse_business_type', 'SalonOrSpa' );
        $schema = [
            '@context'   => 'https://schema.org',
            '@type'      => [ 'HealthAndBeautyBusiness', $business_type ],
            'name'       => $name,
            'url'        => get_option( 'asse_website' ) ?: home_url(),
        ];

        // Description
        $desc = get_option( 'asse_business_description' );
        if ( $desc ) {
            $schema['description'] = $desc;
        }

        // Phone
        $phone = get_option( 'asse_phone' );
        if ( $phone ) {
            $schema['telephone'] = $phone;
        }

        // Email
        $email = get_option( 'asse_email' );
        if ( $email ) {
            $schema['email'] = $email;
        }

        // Image
        $image = get_option( 'asse_image' );
        if ( $image ) {
            $schema['image'] = $image;
        }

        // Logo
        $logo = get_option( 'asse_logo' );
        if ( $logo ) {
            $schema['logo'] = [
                '@type' => 'ImageObject',
                'url'   => $logo,
            ];
        }

        // Address
        $street  = get_option( 'asse_street_address' );
        $city    = get_option( 'asse_city' );
        $state   = get_option( 'asse_state' );
        $zip     = get_option( 'asse_postal_code' );
        $country = get_option( 'asse_country', 'US' );

        if ( $street || $city ) {
            $schema['address'] = [
                '@type'           => 'PostalAddress',
                'streetAddress'   => $street,
                'addressLocality' => $city,
                'addressRegion'   => $state,
                'postalCode'      => $zip,
                'addressCountry'  => $country,
            ];
        }

        // Geo coordinates
        $lat = get_option( 'asse_latitude' );
        $lng = get_option( 'asse_longitude' );
        if ( $lat && $lng ) {
            $schema['geo'] = [
                '@type'     => 'GeoCoordinates',
                'latitude'  => (float) $lat,
                'longitude' => (float) $lng,
            ];
        }

        // Opening hours
        $hours = get_option( 'asse_hours', [] );
        if ( ! empty( $hours ) && is_array( $hours ) ) {
            $schema['openingHoursSpecification'] = [];
            foreach ( $hours as $h ) {
                if ( ! empty( $h['days'] ) && ! empty( $h['open'] ) && ! empty( $h['close'] ) ) {
                    $schema['openingHoursSpecification'][] = [
                        '@type'     => 'OpeningHoursSpecification',
                        'dayOfWeek' => (array) $h['days'],
                        'opens'     => $h['open'],
                        'closes'    => $h['close'],
                    ];
                }
            }
        }

        // Price range
        $price = get_option( 'asse_price_range', '$$$' );
        if ( $price ) {
            $schema['priceRange'] = $price;
        }

        // Additional type (dual-category like BeautySalon + DaySpa)
        $additional_type = get_option( 'asse_additional_type' );
        if ( $additional_type ) {
            $schema['additionalType'] = $additional_type;
        }

        // Alternate names (search variations)
        $alternate_names = get_option( 'asse_alternate_names', [] );
        if ( ! empty( $alternate_names ) && is_array( $alternate_names ) ) {
            $schema['alternateName'] = array_filter( (array) $alternate_names );
        }

        // SameAs (social links)
        $same_as = get_option( 'asse_same_as', [] );
        if ( ! empty( $same_as ) && is_array( $same_as ) ) {
            $schema['sameAs'] = array_filter( (array) $same_as );
        }

        // Aggregate rating — prefer Google override if set
        $google_rating = get_option( 'asse_google_rating' );
        $google_count  = get_option( 'asse_google_review_count' );
        if ( $google_rating && $google_count ) {
            $schema['aggregateRating'] = [
                '@type'       => 'AggregateRating',
                'ratingValue'  => $google_rating,
                'reviewCount' => $google_count,
                'bestRating'   => '5',
            ];
        } else {
            $agg = $this->store->get_aggregate_rating();
            if ( $agg ) {
                $schema['aggregateRating'] = [
                    '@type'       => 'AggregateRating',
                    'ratingValue'  => $agg['ratingValue'],
                    'reviewCount' => $agg['reviewCount'],
                    'bestRating'   => $agg['bestRating'],
                ];
            }
        }

        return $schema;
    }

    /**
     * FAQ schema
     */
    private function get_faq_schema() {
        $faqs = $this->store->get_faqs();
        if ( empty( $faqs ) ) {
            return null;
        }

        $entities = [];
        foreach ( $faqs as $faq ) {
            $entities[] = [
                '@type'          => 'Question',
                'name'          => $faq['question'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text'  => $faq['answer'],
                ],
            ];
        }

        return [
            '@context'    => 'https://schema.org',
            '@type'       => 'FAQPage',
            'mainEntity'  => $entities,
        ];
    }

    /**
     * Service schema
     */
    private function get_service_schema() {
        $services = $this->store->get_services();
        if ( empty( $services ) ) {
            return null;
        }

        $business_name = get_option( 'asse_business_name', '' );

        // Group by category
        $grouped = [];
        foreach ( $services as $s ) {
            $cat = $s['category'] ?: 'General';
            if ( ! isset( $grouped[ $cat ] ) ) {
                $grouped[ $cat ] = [];
            }
            $grouped[ $cat ][] = $s;
        }

        // Output one Service schema per category with offerCatalog
        $schemas = [];
        foreach ( $grouped as $category => $items ) {
            $offers = [];
            foreach ( $items as $item ) {
                $offers[] = [
                    '@type'       => 'Offer',
                    'itemOffered' => [
                        '@type'       => 'Service',
                        'name'        => $item['name'],
                        'description' => wp_trim_words( $item['description'], 30 ),
                    ],
                ];
            }

            $schemas[] = [
                '@context'       => 'https://schema.org',
                '@type'          => 'Service',
                'serviceType'    => $category,
                'provider'      => [
                    '@type' => get_option( 'asse_business_type', 'SalonOrSpa' ),
                    'name'  => $business_name,
                ],
                'areaServed'    => [
                    '@type' => 'City',
                    'name'  => get_option( 'asse_city', '' ),
                ],
                'hasOfferCatalog' => [
                    '@type'         => 'OfferCatalog',
                    'name'         => $category,
                    'itemListElement' => $offers,
                ],
            ];
        }

        // If multiple categories, wrap in @graph
        if ( count( $schemas ) > 1 ) {
            return [
                '@context' => 'https://schema.org',
                '@graph'   => $schemas,
            ];
        }

        return $schemas[0];
    }

    /**
     * Review schema
     */
    private function get_review_schema() {
        $reviews = $this->store->get_reviews();
        if ( empty( $reviews ) ) {
            return null;
        }

        $business_name = get_option( 'asse_business_name', '' );
        $business_type = get_option( 'asse_business_type', 'SalonOrSpa' );
        $entities = [];

        foreach ( $reviews as $r ) {
            $entities[] = [
                '@type'        => 'Review',
                'reviewRating' => [
                    '@type'       => 'Rating',
                    'ratingValue' => (string) $r['rating'],
                    'bestRating'  => '5',
                ],
                'author'       => [
                    '@type' => 'Person',
                    'name'  => $r['author'],
                ],
                'reviewBody'   => $r['text'],
                'datePublished' => $r['date'],
                'itemReviewed' => [
                    '@type' => $business_type,
                    'name'  => $business_name,
                ],
            ];
        }

        if ( count( $entities ) > 1 ) {
            return [
                '@context' => 'https://schema.org',
                '@graph'   => $entities,
            ];
        }

        return $entities[0];
    }

    /**
     * Team / Person schema
     */
    private function get_team_schema() {
        $team = $this->store->get_team();
        if ( empty( $team ) ) {
            return [];
        }

        $business_name = get_option( 'asse_business_name', '' );
        $schemas = [];

        foreach ( $team as $member ) {
            $person = [
                '@context'  => 'https://schema.org',
                '@type'     => 'Person',
                'name'      => $member['name'],
                'worksFor'  => [
                    '@type' => get_option( 'asse_business_type', 'SalonOrSpa' ),
                    'name'  => $business_name,
                ],
            ];

            if ( $member['title'] ) {
                $person['jobTitle'] = $member['title'];
            }
            if ( $member['bio'] ) {
                $person['description'] = wp_trim_words( $member['bio'], 50 );
            }
            if ( $member['specialty'] ) {
                $person['knowsAbout'] = array_map( 'trim', explode( ',', $member['specialty'] ) );
            }
            if ( $member['image'] ) {
                $person['image'] = $member['image'];
            }

            $schemas[] = $person;
        }

        return $schemas;
    }
}