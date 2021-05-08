const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');


const userSchema = new mongoose.Schema({
    name: {
       type: String,
       required: true,
       trim: true

    },
    email: {
       type: String,
       unique: true,
       required: true,
       trim: true,
       lowercase: true,
       validate(value){
           if(!validator.isEmail(value)){
              throw new Error('Email is invalid!'); 
           }
       }
    }, 
    age: {
        type:Number,
        default: 0,
        validate(value){
           if(value < 0){
               throw new Error('Age must be a positive number');
           }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value){
           if(value.toLowerCase().includes('password')){
               throw new Error('The password cannot contains "password"!');
           }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// Create a relationship between users and tasks
userSchema.virtual('tasks', {
    ref:'Task',
    localField: '_id',
    foreignField: 'owner'
});


// Getting public profile

// userSchema.methods.getPublicProfile = function() {
//     const user = this;
//     const userObject = user.toObject();
     
//     delete userObject.password;
//     delete userObject.tokens;
     
//     return userObject;
// } 


userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
     // Removing orphan files when deleting a user
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
     
    return userObject;
} 



// generating authorization token
userSchema.methods.generateAuthToken = async function() {
      const user = this;
      const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET);
      user.tokens = user.tokens.concat({ token });
      await user.save();
      return token;

}


// Adding a personalized function to the model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if(!user){
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Unable to login!')
    }

    return user;
}





// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
   const user = this;

   // isModified returns true when the user is first created or updated and password is one of the things changed
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }

   next()
});

// Delete user task when user is removed
userSchema.pre('remove', async function(next){
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

// Creating model of data to store in database
const User = mongoose.model('User', userSchema);



module.exports = User;