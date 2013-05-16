var jugglingdb = require('jugglingdb');
var async = require('async');

function patchAdapter(schema){
    schema.registry = {
        schema : schema,
        nameByModelDx : [],
        idByModelName : {},
        registerModels : function (cb) {
            var list = [];
            for (modelName in this.schema.models) {
                list.push(modelName);
            }
            if(this.schema.connected){
                this.registerModelList(list, cb);
            } else {
                var scope = this;
                this.schema.on('connected', function () {
                    scope.registerModelList(list, cb);
                });
            }
        },
        registerModelList : function (modelList, cb) {
            var scope = this;
            async.each(modelList, this.registerModel.bind(scope), function (err) {
                if(!err){
                    scope.schema.emit('jdb-gfk:models_registered');
                    if(cb){
                        cb();
                    }
                } else {
                    throw "jdb-gfk: Failed to register models."
                }
            });
        },
        registerModel : function (modelName, cb) {
            var self = this;
            var scb = cb;
            var f = {table_name: modelName};
            self.schema.models.SchemaEntity.findOne(f, function (err, schemaEntity) {
                if (!err && !schemaEntity) {
                    self.schema.models.SchemaEntity.create({table_name: modelName}, function (err, obj) {
                        if (obj) {
                            self.setProperties(modelName, obj);
                            if(scb){
                                scb();
                            }
                        } else {
                            throw "jdb-gfk: Failed to register " + modelName;
                        }
                    });
                } else if (schemaEntity) {
                    self.setProperties(modelName, schemaEntity);
                    if(scb){
                        scb();
                    }
                } else {
                    throw "jdb-gfk: Failed to register " + modelName;
                }
            });
        },
        getEntityById : function (id) {
            return this.schema.models[this.nameByModelDx[id]];
        },
        setProperties : function (modelName, schemaEntity) {
            this.idByModelName[modelName] = schemaEntity.id;
            this.nameByModelDx[schemaEntity.id] = modelName;
            var m = this.getEntityById(schemaEntity.id);
            m.schemaEntityId = schemaEntity.id;
        }
    };
};


function prepareSchema(schema, patchAdapter){
    
    schema.define('SchemaEntity', {
        table_name : { 
            type: String,  
            limit: 191, // Humoring mysql utf8mb4.
            index: {kind: 'unique'}
        }
    });
    
    schema.isActual(function (err, actual) {
        if (!actual) {
            this.autoupdate(function(){
                patchAdapter(schema);
            });
        } else {
            patchAdapter(schema);
        }
    });
    
};

jugglingdb.Schema.prototype.registryInit = function () {
    prepareSchema(this, patchAdapter);
};

module.exports = jugglingdb;

