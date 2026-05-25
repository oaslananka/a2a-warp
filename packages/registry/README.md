# @oaslananka/a2a-warp-registry

Registry server, discovery API, health polling, matching, and storage helpers.

## Redis Storage

`RedisStorage` accepts the original JSON key/value client shape:

```ts
new RedisStorage({
  get: (key) => redis.get(key),
  set: (key, value) => redis.set(key, value),
  del: (key) => redis.del(key),
});
```

For production Redis clients, also expose set commands so registry indexes are maintained atomically:

```ts
new RedisStorage({
  get: (key) => redis.get(key),
  set: (key, value) => redis.set(key, value),
  del: (key) => redis.del(key),
  sadd: (key, ...members) => redis.sadd(key, ...members),
  srem: (key, ...members) => redis.srem(key, ...members),
  smembers: (key) => redis.smembers(key),
  multi: () => redis.multi(),
});
```

The lowercase `sadd`, `srem`, and `smembers` methods are the canonical capability interface. Common node-redis aliases `sAdd`, `sRem`, `sMembers`, and raw uppercase command names are also detected. Existing JSON-array clients remain supported for tests and lightweight fakes, so this is a backward-compatible interface expansion.
