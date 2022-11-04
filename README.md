# next-auth-adapter-edgedb

This is currently a hacked together solution that works for me.

## The schema

The schema **must** follow the schema defined in [schema.edsl](./schema.esdl).

## Building:

Run `npx @edgedb/generate edgeql-js -I <instance_name> --out src/dbschema/edgeql-js`.
