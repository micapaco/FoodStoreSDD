# single-role-and-client-cart-hotfix

## Why
Admin user management currently allows assigning multiple roles to one user. In the running app this causes mixed navigation and capabilities, for example an operational user can still expose client cart chrome if a `CLIENT` role is also assigned.

The product behavior expected for this project is one active role per user.

## What Changes
- Backend role replacement validates that exactly one role is submitted.
- Admin users UI uses a single role selector instead of multi-role checkboxes.
- Private header shows the cart button/drawer only for pure `CLIENT` users.

## Impact
- Cross-domain hotfix across admin users and layout chrome.
- No database migration required; the existing M:N table remains as persistence infrastructure, but the service/API enforces a single assigned role.
- Existing mixed-role users can be normalized by editing them once in the admin UI.
