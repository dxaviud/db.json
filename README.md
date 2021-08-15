# dbjson

A (very slim) DBMS for Node.js that uses JSON files to store data.

## Usage

### Install

`npm i @dxaviud/dbjson`

### Import

```javascript
import db from "@dxaviud/dbjson";
```
(Must have `"type" : "module"` in package.json)

### API

Call methods on the `db` object to interact with the database.

The `db` object has just 6 methods: `set`, `has`, `get`, `delete`, `persist`, and `persistAll`, all of which are **asynchronous**

`set`: 
```javascript
async set(identifier: string, object: object): Promise<boolean>
```
Saves the object to a cache. The identifier is used for retrieving the object.
Returns true.

`has`:
```javascript
async has(identifier: string): Promise<boolean>
```
Returns true if the object identified by the identifier exists in the cache or database, false if not.

`get`:
```javascript
async get(identifier: string): Promise<object | null>
```
Returns the object identified by the identifier from the cache or database, or null if it does not exist.

`delete`:
```javascript
async delete(identifier: string): Promise<boolean>
```
Returns true if the object identified by the identifier was deleted from the cache and registered for deletion from the database, false if not.

`persist`:
```javascript
async persist(identifier: string): Promise<boolean>
```
Persists the changes made to the object identified by the identifier to the database. This method (or `persistAll`) must be called to persist changes to the database.
Returns true if the object was persisted, false if not.

`persistAll`:
```javascript
async persistAll(): Promise<boolean>
```
Persists changes to all known objects since the start of the application to the database. This method (or `persist`) must be called to persist changes to the database.
Returns true if all objects were persisted, false if not.
