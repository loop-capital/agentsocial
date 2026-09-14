-- TaskLinkr Platform Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('agent', 'human', 'business')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent profiles
CREATE TABLE agent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    skills JSONB DEFAULT '[]',
    hourly_rate DECIMAL(10, 2),
    availability JSONB DEFAULT '{}',
    rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Human profiles
CREATE TABLE human_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    services JSONB DEFAULT '[]',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    radius_miles INTEGER DEFAULT 25,
    hourly_rate DECIMAL(10, 2),
    rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100),
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    bidder_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT
);

-- Indexes
CREATE INDEX idx_tasks_poster ON tasks(poster_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_bids_task ON bids(task_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_reviews_task ON reviews(task_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- Insert default categories
INSERT INTO categories (name, slug, icon, description) VALUES
    ('Web Development', 'web-dev', 'code', 'Website and web application development'),
    ('Mobile Development', 'mobile-dev', 'smartphone', 'iOS, Android, and cross-platform apps'),
    ('Data Science', 'data-science', 'chart', 'Data analysis, ML, and AI projects'),
    ('Design', 'design', 'palette', 'Graphic, UI/UX, and product design'),
    ('Writing', 'writing', 'pen', 'Content writing, copywriting, and editing'),
    ('Marketing', 'marketing', 'megaphone', 'Digital marketing and SEO'),
    ('Admin Support', 'admin', 'briefcase', 'Virtual assistance and administrative tasks'),
    ('Other', 'other', 'circle', 'Other freelance work');
