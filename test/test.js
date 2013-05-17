var assert = require("assert");
var Schema = require('../jdb-gfk.js').Schema;

var jdb = (new Schema('memory')).registryInit();

describe('Schema Instance', function(){
    it('should have a registry', function() {
        assert(jdb.hasOwnProperty('registry'));
    });
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

describe('Model Registration and Generic Relations', function(){
    it('should register models', function(done) {
        jdb.on('jdb-gfk:models_registered', function(){
            assert(jdb.models.User.schemaEntityId && jdb.models.User.schemaEntityId > 0);
            assert(jdb.models.Food.schemaEntityId && jdb.models.Food.schemaEntityId > 0);
            assert(jdb.models.Like.schemaEntityId && jdb.models.Like.schemaEntityId > 0);
            done();
        });
        jdb.registry.registerModels(function(){
           assert(jdb.models.SchemaEntity && jdb.models.SchemaEntity.schemaEntityId  > 0);
        });
    });
    
    it('should set up a generic relation for a model', function() {
        assert(jdb.models.Like.hasOwnProperty('genericBelongsTo'));
        assert(typeof jdb.models.Like.genericBelongsTo === 'function');
        jdb.models.Like.genericBelongsTo();
    });
    
    it('should resolve a generic relation to one kind of model', function(done){
        User.create({name: 'Ted'}, function(err, obj){
            assert(!err);
            assert(obj);
            Like.create({q: 'a'}, function(err, lobj){
                assert(!err);
                assert(lobj);
                lobj.related(obj);
                lobj.save(function(){
                    Like.findOne({where: {q: 'a'}}, function(err, nobj){
                       assert(!err);
                       assert(nobj);
                       nobj.related(function(err, robj){
                           assert(!err);
                           assert(robj);
                           assert(robj.name == 'Ted');
                           done();
                       }); 
                    });
                });
            });
        });
    });
    
    it('should resolve a generic relation to another kind of model', function(done){
        Food.create({name: 'Pizza'}, function(err, obj){
            assert(!err);
            assert(obj);
            Like.create({q: 'b'}, function(err, lobj){
                assert(!err);
                assert(lobj);
                lobj.related(obj);
                lobj.save(function(){
                    Like.findOne({where: {q: 'b'}}, function(err, nobj){
                       nobj.related(function(err, robj){
                           assert(!err);
                           assert(robj);
                           assert(robj.name == 'Pizza');
                           done();
                       }); 
                    });
                });
            });
        });
    });
});


    

    


