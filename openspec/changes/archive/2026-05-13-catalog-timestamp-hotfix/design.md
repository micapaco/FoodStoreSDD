# Design

## Context
The failing error is raised before insert commit:

`can't subtract offset-naive and offset-aware datetimes`

The SQL emitted for `categoria.created_at` / `updated_at` binds `TIMESTAMP WITHOUT TIME ZONE`, but the model default produces `datetime.now(timezone.utc)`.

## Approach
- Add a small `_utc_now_naive()` helper in `backend/app/db/models/catalogo.py`.
- Use it for `Categoria` and `Ingrediente` `created_at` / `updated_at` defaults.
- Add the same helper in `BaseRepository` and use it for soft delete.
- In category and ingredient services, replace invalid `datetime.now(datetime.timezone.utc)` calls with UTC-naive timestamps.

## Non-Goals
- Do not change endpoint payloads or responses.
- Do not alter the database schema.
- Do not refactor all timestamp models in the project.
