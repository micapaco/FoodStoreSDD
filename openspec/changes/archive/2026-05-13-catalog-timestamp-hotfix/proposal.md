# catalog-timestamp-hotfix

## Why
Category creation currently fails in a clean local setup with asyncpg because `Categoria` and `Ingrediente` model defaults generate timezone-aware datetimes while their SQLModel columns are bound as `TIMESTAMP WITHOUT TIME ZONE`.

This breaks the archived catalog API contract and prevents the new admin categories UI from performing CRUD operations.

## What Changes
- Normalize `Categoria` and `Ingrediente` timestamp defaults to UTC-naive datetimes, matching their current database bindings.
- Normalize generic soft delete timestamps to UTC-naive datetimes for compatibility with timestamp-without-timezone catalog columns.
- Fix category and ingredient update timestamp assignment so edit flows do not crash.

## Impact
- Backend-only bug fix.
- No API contract changes.
- No migration required because the patch aligns Python values with the currently bound database column type.
