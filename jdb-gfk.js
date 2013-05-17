var jugglingdb = require('jugglingdb');
var async = require('async');
var AbstractClass = jugglingdb.AbstractClass;

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
            this.schema.models.SchemaEntity.findOne(f, function (err, schemaEntity) {
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
            this.injectBelongsTo(modelName);
        },
        getEntityById : function (id) {
            return this.schema.models[this.nameByModelDx[id]];
        },
        setProperties : function (modelName, schemaEntity) {
            this.idByModelName[modelName] = schemaEntity.id;
            this.nameByModelDx[schemaEntity.id] = modelName;
            var m = this.getEntityById(schemaEntity.id);
            m.schemaEntityId = schemaEntity.id;
        },
        injectBelongsTo : function (modelName) {
            this.schema.models[modelName].genericBelongsTo = function(params){
                var schemaEntityIdColumn = 'schemaEntityId';
                var relatedIdColumn = 'relatedId';
                var methodName = 'related';
                
                if(params && params.schemaEntityIdColumn){
                    schemaEntityIdColumn = params.schemaEntityIdColumn;
                }
                if(params && params.relatedIdColumn){
                    relatedIdColumn = params.relatedIdColumn;
                }
                if(params && params.as){
                    methodName = params.as;
                }
                
                this.relations[methodName] = {
                    type: 'genericBelongsTo',
                    keyTo: 'id',
                    schemaTo: schemaEntityIdColumn,
                    keyFrom: relatedIdColumn,
                    multiple: false
                };
                
                this.prototype['__finders__'] = this.prototype['__finders__'] || {};
                
                this.prototype[methodName] = function (refresh, p) {
                    if (arguments.length === 1) {
                        p = refresh;
                        refresh = false;
                    } else if (arguments.length > 2) {
                        throw new Error('Method can\'t be called with more than two arguments');
                    }
                    var self = this;
                    var cachedValue;
                    if (!refresh && this.__cachedRelations && (typeof this.__cachedRelations[methodName] !== 'undefined')) {
                        cachedValue = this.__cachedRelations[methodName];
                    }
                    if (p instanceof AbstractClass) { // acts as setter
                        this[schemaEntityIdColumn] = p.constructor.schemaEntityId;
                        this[relatedIdColumn] = p.id;
                        this.__cachedRelations[methodName] = p;
                    } else if (typeof p === 'function') { // acts as async getter
                        if (typeof cachedValue === 'undefined') {
                            this.__finders__[methodName].apply(self, 
                                [
                                    { 
                                        schemaEntityId: this[schemaEntityIdColumn], 
                                        relatedId: this[relatedIdColumn]
                                    }, 
                                    function (err, inst) {
                                        if (!err) {
                                            self.__cachedRelations[methodName] = inst;
                                        }
                                        p(err, inst);
                                    }
                                ]
                            );
                            return {    
                                        schemaEntityId: this[schemaEntityIdColumn], 
                                        relatedId: this[relatedIdColumn]
                                    };
                        } else {
                            p(null, cachedValue);
                            return cachedValue;
                        }
                    } else if (typeof p === 'undefined') { // acts as sync getter
                        return {schemaEntityId: this[schemaEntityIdColumn], relatedId: this[relatedIdColumn]};
                    } else { // setter
                        this[schemaEntityIdColumn] = p.constructor.schemaEntityId;
                        this[relatedIdColumn] = p.id;
                        delete this.__cachedRelations[methodName];
                    }
                };
                
                this.prototype['__finders__'][methodName] = function (relation, cb) {
                    if (relation === null || !relation.schemaEntityId || !relation.relatedId) {
                        cb(null, null);
                        return;
                    }
                    var model = this.constructor.schema.registry.getEntityById(relation.schemaEntityId);
                    if(model){
                        model.find(relation.relatedId, function (err,inst) {
                            if (err) return cb(err);
                            if (!inst) return cb(null, null);
                            if (inst.id === relation.relatedId) {
                                cb(null, inst);
                            } else {
                                cb(new Error('Permission denied - id mismatch.'));
                            }
                        }.bind(this));
                    } else {
                        cb(new Error('Model has not been registered for generic use.'));
                    }
                };
            };
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

