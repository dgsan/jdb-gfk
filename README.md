jdb-gfk
=======

Generic foreign keys for JDB.

### Usage

jdb-gfk provides generic foreign keys for JugglingDB by wrapping it.

To use, require `jdb-gfk` instead of `jugglingdb`.
```javascript
var Schema = require('jdb-gfk').Schema;

```

Once required, generic relations need to be initialized on `Schema` instances by calling `registryInit()`.
```javascript
var jdb = new Schema('memory');
jdb.registryInit();
```
This will give your `Schema` instance some additional methods and provide the `SchemaEntity` model.

After you've declared your models, call `registry.registerModels()` on your `Schema` instance. 

```javascript
jdb.registry.registerModels();
```

You can provide a callback or listen for the `jdb-gfk:models_registered` event.
```javascript
jdb.on('jdb-gfk:models_registered', function(){
    Like.genericBelongsTo();
});

// or:

jdb.registry.registerModels(function(){
    Like.genericBelongsTo();
});
```

Models can use `genericBelongsTo()` much like `belongsTo()`, only the related entity can be any type of model using the same `Schema` instance.
It optionaly takes an object as an argument like so: `{ schemaEntityIdColumn: <column_name>, relatedIdColumn: <column_name>, methodName: <method_name> }`,
where each property is also optional: `Like.belongsTo({methodName: 'target'})`, for example.

Once you have a `Like` object `like`, you can `like.related(anotherObject)` to set the relationship, or `like.related(function(err, obj){ // do stuff })` to retrieve the related entity.



