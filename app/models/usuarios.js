var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../../config').secret;

var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true, required: [true, "no puede estar vacio"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
  email: {type: String, lowercase: true, unique: true, required: [true, "no puede estar vacio"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
  privilege: {type: String, default: 'Usuario', enum: ['Usuario', 'Admin', 'Proveedor'] },
  hash: String,
  salt: String,
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: '{PATH} ya esta en uso.'});

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000) + (60 * 60),
  }, secret);
};

UserSchema.methods.toAuthJSON = function(){
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    privilege: this.privilege,
    token: this.generateJWT()
  };
};




mongoose.model('Usuarios', UserSchema);