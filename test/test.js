var Schema = require('../jdb-gfk.js').Schema;

/* @TODO write actual unit tests. */

var jdb = new Schema('memory');

jdb.on('jdb-gfk:models_registered', function(){
    console.log(User.schemaEntityId);
    console.log(jdb.models.SchemaEntity.schemaEntityId);
});

jdb.registryInit();
var User = jdb.define('User', {
   email: String,
   password: String 
});

jdb.registry.registerModels(function(){
    console.log(User.schemaEntityId);
    console.log(jdb.models.SchemaEntity.schemaEntityId);
});

