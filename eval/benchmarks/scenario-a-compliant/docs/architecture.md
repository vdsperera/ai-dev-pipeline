# Architecture Document

## Service Boundaries
All database operations must route through the UserRepository or UserService.
Controllers and Presentation components must never execute direct SQL.
