CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collaborators (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    secondary_task TEXT,
    company VARCHAR(200),
    observations TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'media',
    project_id VARCHAR(100),
    task_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_task_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_collaborators (
    task_id VARCHAR(100) NOT NULL,
    collaborator_id VARCHAR(100) NOT NULL,

    PRIMARY KEY (task_id, collaborator_id),

    CONSTRAINT fk_task_collaborator_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_collaborator_collaborator
        FOREIGN KEY (collaborator_id)
        REFERENCES collaborators(id)
        ON DELETE CASCADE
);