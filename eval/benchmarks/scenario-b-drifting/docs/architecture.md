# Architecture Document

## Layering
Controllers must only handle HTTP routing and delegation.
All database access must be through Repositories using parameterised queries.
