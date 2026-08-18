FROM mysql:8.0

# Copy init script — MySQL image runs all .sql files in this directory on first boot
COPY init.sql /docker-entrypoint-initdb.d/01-databases.sql
