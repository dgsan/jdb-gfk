var Schema = require('../jdb-gfk.js').Schema;

/* @TODO write actual unit tests. */

var jdb = (new Schema('memory')).registryInit();

jdb.on('jdb-gfk:models_registered', function(){
    console.log(User.schemaEntityId);
    console.log(jdb.models.SchemaEntity.schemaEntityId);
});

var User = jdb.define('User', {
   name: String
});

var Food = jdb.define('Food', {
   name: String 
});

var Like = jdb.define('Like', {
    q : String,
    schemaEntityId: Number,
    relatedId: Number
})

jdb.registry.registerModels(function(){
    
    Like.genericBelongsTo();
    
    console.log(User.schemaEntityId);
    console.log(jdb.models.SchemaEntity.schemaEntityId);
    
    
    User.create({name: 'Ted'}, function(err, obj){
        console.log(err || obj);
        Like.create({q: 'a'}, function(err, lobj){
            console.log(err || lobj);
            lobj.related(obj);
            lobj.save(function(){
                Like.findOne({where: {q: 'a'}}, function(err, nobj){
                   console.log(nobj); 
                   nobj.related(function(err, robj){
                       console.log(robj);
                   }); 
                });
            });
            
        });
    });
    
    Food.create({name: 'Pizza'}, function(err, obj){
        console.log(err || obj);
        Like.create({q: 'b'}, function(err, lobj){
            console.log(err || lobj);
            lobj.related(obj);
            lobj.save(function(){
                Like.findOne({where: {q: 'b'}}, function(err, nobj){
                   console.log(nobj);
                   nobj.related(function(err, robj){
                       console.log(robj);
                   }); 
                });
            });
        });
    });
    
});

