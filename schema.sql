CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	name VARCHAR(255) UNIQUE NOT NULL,
	description TEXT DEFAULT '',
	ignore_files TEXT DEFAULT '[]',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snippets (
	id TEXT PRIMARY KEY,
	project_id TEXT,
	name VARCHAR(255),
	content TEXT DEFAULT '',
	summary TEXT DEFAULT '',
	included BOOLEAN DEFAULT 1,
	use_title BOOLEAN DEFAULT 1,
	use_summary BOOLEAN DEFAULT 0,
	type VARCHAR(25),
	position INTEGER,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (project_id) REFERENCES projects (id),
	UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS files (
	id TEXT PRIMARY KEY,
	project_id TEXT,
	name VARCHAR(255),
	summary TEXT DEFAULT '',
	included BOOLEAN DEFAULT 1,
	use_title BOOLEAN DEFAULT 1,
	use_summary BOOLEAN DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (project_id) REFERENCES projects (id),
	UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS schema_versions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	version INTEGER UNIQUE NOT NULL,
	applied_at TIMESTAMP
);
