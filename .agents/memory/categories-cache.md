---
name: Categories cache key
description: NodeCache key for public categories and where to invalidate it.
---

## Rule
The public `/api/categories` response is cached under key `"pub_categories"` (NodeCache, 300-second TTL).

**Why:** Reduces DB round-trips for the most-read public endpoint without stale data risk, as long as all mutation paths invalidate it.

**How to apply:** After every successful write to `event_categories` or `event_subcategories`, call:
```js
cache.del("pub_categories");
```

This is already wired into all 6 handlers:
- POST /api/admin/categories (create category)
- PUT /api/admin/categories/:id (rename category)
- DELETE /api/admin/categories/:id (delete category)
- POST /api/admin/categories/:id/subcategories (add subcategory)
- PUT /api/admin/subcategories/:id (rename subcategory)
- DELETE /api/admin/subcategories/:id (delete subcategory)
