# dbjson

A small database/cache for Node.js that uses JSON files to store data.

## Usage

### Install

`npm i @dxaviud/dbjson`

### Import

```javascript
import db from "@dxaviud/dbjson";
```

(Must have `"type" : "module"` in package.json)

### API

Call methods on the imported `db` object to interact with the database.

The `db` object has just 6 methods: `set`, `has`, `get`, `delete`, `persist`, and `persistAll`, all of which are **asynchronous**.  
They are documented below.

---

`set`:

```javascript
async set(identifier: string, object: object): Promise<boolean>
```

Saves the `object` to a cache. The `identifier` is used for retrieving the `object`.
Returns `true`.

---

`has`:

```javascript
async has(identifier: string): Promise<boolean>
```

Returns `true` if the `object` identified by the `identifier` exists in the cache or database, `false` if not.
  
---

`get`:

```javascript
async get(identifier: string): Promise<object | null>
```

Returns the `object` identified by the `identifier` from the cache or database, or `null` if it does not exist.

---

`delete`:

```javascript
async delete(identifier: string): Promise<boolean>
```

Returns `true` if the `object` identified by the `identifier` was deleted from the cache and registered for deletion from the database, `false` if not.

---

`persist`:

```javascript
async persist(identifier: string): Promise<boolean>
```

Persists the changes made to the `object` identified by the `identifier` to the database. This method (or `persistAll`) must be called to persist changes to the database.
Returns `true` if the object was persisted, `false` if not.

---

`persistAll`:

```javascript
async persistAll(): Promise<boolean>
```

Persists changes to all `object`s that were retrieved using the `get` method, set using the `set` method, or deleted using the `delete` method since the start of the application. This method (or `persist`) must be called to persist changes to the database.
Returns `true` if all `object`s were persisted, `false` if not.

### Examples

```javascript
import db from "@dxaviud/dbjson";

await db.set("hi", { data: "hi" });
// if persist or persistAll is not called, the database will not have the "hi" object stored upon termination of the program
await db.persist("hi");
console.log(await db.has("hi"));
console.log(await db.get("hi"));

// this uses a qualified identifier ("greetings" is separated from "hi" with a dot)
// which causes a "greetings" directory to be made, in which the "hi" object will be put
await db.set("greetings.hi", { data: "hi" });
await db.persist("greetings.hi");
console.log(await db.has("greetings.hi"));
console.log(await db.get("greetings.hi"));

// this would create a nested directory structure
await db.set("a.b.c.d.foo", { data: "foo" });
await db.persist("a.b.c.d.foo");
console.log(await db.has("a.b.c.d.foo"));
console.log(await db.get("a.b.c.d.foo"));

await db.set("e", { data: "e" });
await db.set("f", { data: "f" });
await db.set("g", { data: "g" });
await db.persistAll();
console.log(await db.has("e"));
console.log(await db.has("f"));
console.log(await db.has("g"));
console.log(await db.get("e"));
console.log(await db.get("f"));
console.log(await db.get("g"));

const hi = await db.get("hi");
console.log(hi);
hi.data = "hello"; // modifying the retrieved object
await db.persist("hi"); // no need to call set, simply persist again
// ...
console.log(await db.get("hi"));

// delete prepares the "hi" object for deletion, but the "hi" object is not actually deleted until a persist call
// however, "hi" will be deleted from the cache upon the delete call
await db.delete("hi");
await db.persist("hi");
```
