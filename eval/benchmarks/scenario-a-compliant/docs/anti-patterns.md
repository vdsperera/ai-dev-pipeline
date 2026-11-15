# Anti-Patterns

### AP-001: Direct SQL in Presentation Layer
- **Mistake**: Direct database queries in controllers or routes.
- **Correction**: Encapsulate queries in service or repository classes.
- **Rule**: Never run SQL directly in presentation or controller layers.

