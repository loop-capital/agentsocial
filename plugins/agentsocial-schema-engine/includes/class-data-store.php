<?php
/**
 * ASSE Data Store — Custom post types for services, FAQ, reviews, team
 */
class ASSE_Data_Store {

    public function register_post_types() {
        // FAQ Items
        register_post_type( 'asse_faq', [
            'labels'       => [
                'name'          => 'FAQ Items',
                'singular_name' => 'FAQ Item',
                'add_new_item'  => 'Add FAQ Item',
                'edit_item'     => 'Edit FAQ Item',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'supports'     => [ 'title', 'editor' ],
        ]);

        // Services
        register_post_type( 'asse_service', [
            'labels'       => [
                'name'          => 'Services',
                'singular_name' => 'Service',
                'add_new_item'  => 'Add Service',
                'edit_item'     => 'Edit Service',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'supports'     => [ 'title', 'editor', 'excerpt' ],
        ]);

        // Reviews
        register_post_type( 'asse_review', [
            'labels'       => [
                'name'          => 'Reviews',
                'singular_name' => 'Review',
                'add_new_item'  => 'Add Review',
                'edit_item'     => 'Edit Review',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'supports'     => [ 'title', 'editor' ],
        ]);

        // Team Members
        register_post_type( 'asse_team', [
            'labels'       => [
                'name'          => 'Team Members',
                'singular_name' => 'Team Member',
                'add_new_item'  => 'Add Team Member',
                'edit_item'     => 'Edit Team Member',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'supports'     => [ 'title', 'editor', 'thumbnail' ],
        ]);
    }

    /**
     * Get FAQ items
     */
    public function get_faqs() {
        $posts = get_posts( [
            'post_type'   => 'asse_faq',
            'numberposts' => 50,
            'orderby'     => 'menu_order date',
            'order'       => 'ASC',
        ]);

        $items = [];
        foreach ( $posts as $p ) {
            $items[] = [
                'id'     => $p->ID,
                'question' => $p->post_title,
                'answer'   => $p->post_content,
            ];
        }
        return $items;
    }

    /**
     * Get services
     */
    public function get_services() {
        $posts = get_posts( [
            'post_type'   => 'asse_service',
            'numberposts' => 50,
            'orderby'     => 'menu_order date',
            'order'       => 'ASC',
        ]);

        $items = [];
        foreach ( $posts as $p ) {
            $category = get_post_meta( $p->ID, '_asse_service_category', true );
            $items[] = [
                'id'          => $p->ID,
                'name'        => $p->post_title,
                'description' => $p->post_content,
                'category'    => $category ?: 'General',
            ];
        }
        return $items;
    }

    /**
     * Get reviews
     */
    public function get_reviews() {
        $posts = get_posts( [
            'post_type'   => 'asse_review',
            'numberposts' => 20,
            'orderby'     => 'date',
            'order'       => 'DESC',
        ]);

        $items = [];
        foreach ( $posts as $p ) {
            $rating   = get_post_meta( $p->ID, '_asse_review_rating', true );
            $author   = get_post_meta( $p->ID, '_asse_review_author', true );
            $date     = get_post_meta( $p->ID, '_asse_review_date', true );
            $items[] = [
                'id'      => $p->ID,
                'author'  => $author ?: 'Anonymous',
                'rating'  => $rating ?: 5,
                'text'    => $p->post_content,
                'date'    => $date ?: $p->post_date,
            ];
        }
        return $items;
    }

    /**
     * Get team members
     */
    public function get_team() {
        $posts = get_posts( [
            'post_type'   => 'asse_team',
            'numberposts' => 30,
            'orderby'     => 'menu_order date',
            'order'       => 'ASC',
        ]);

        $items = [];
        foreach ( $posts as $p ) {
            $title     = get_post_meta( $p->ID, '_asse_team_title', true );
            $specialty = get_post_meta( $p->ID, '_asse_team_specialty', true );
            $image     = get_the_post_thumbnail_url( $p->ID, 'medium' );
            $items[] = [
                'id'         => $p->ID,
                'name'       => $p->post_title,
                'title'      => $title ?: '',
                'specialty'  => $specialty ?: '',
                'bio'        => $p->post_content,
                'image'      => $image ?: '',
            ];
        }
        return $items;
    }

    /**
     * Get aggregate rating from all reviews
     */
    public function get_aggregate_rating() {
        $reviews = $this->get_reviews();
        if ( empty( $reviews ) ) {
            return null;
        }
        $total = 0;
        $count = count( $reviews );
        foreach ( $reviews as $r ) {
            $total += (float) $r['rating'];
        }
        return [
            'ratingValue' => round( $total / $count, 1 ),
            'reviewCount' => $count,
            'bestRating'  => 5,
        ];
    }
}