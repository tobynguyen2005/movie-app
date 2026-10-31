# Movie App Backend

## Movie Tier List

The Tier List is a single shared board managed from the Movie App admin dashboard. It supports six tiers (`S`, `A`, `B`, `C`, `D`, `E`) and stores each movie's tier and position in PostgreSQL.

Only movies whose status is `COMPLETED` (shown in the UI as **Đã hoàn thành / Đã xem**) can be added. A movie can appear only once. When a movie is changed to another status or deleted through the movie API, its Tier List entry is removed automatically.

With the current `spring.jpa.hibernate.ddl-auto=update` setting, Hibernate creates the `movie_tier_entries` table on backend startup. The table has a unique `movie_id` relationship to `movies`.

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/tier-list` | Get entries ordered by tier and position |
| `GET` | `/api/tier-list/available-movies?keyword=` | Find completed movies not yet in the board |
| `POST` | `/api/tier-list` | Add a completed movie to a tier |
| `PUT` | `/api/tier-list/reorder` | Persist all tier assignments and positions after drag-and-drop |
| `DELETE` | `/api/tier-list/{id}` | Remove a movie from the board without deleting the movie |
| `DELETE` | `/api/tier-list` | Clear the board without deleting movies |

Example add request:

```json
{
  "movieId": 12,
  "tier": "S"
}
```

Example reorder request:

```json
[
  { "id": 4, "tier": "S", "position": 0 },
  { "id": 9, "tier": "A", "position": 0 }
]
```

> This codebase currently has no authentication/Spring Security layer. The Tier List is therefore an admin-facing shared feature in the existing CRUD application, but these new API endpoints are not independently protected by an admin role.
