const mongoose = require('mongoose');
const validator = require('validator');




// Validation -> we enforce data to follow some rules
// Sanitization -> alter the data before saving it such as removing empty spaces, lowercasing, etc.
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        required: false,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    }
}, {
    timestamps:true
});

const Task = mongoose.model('Task', taskSchema);


module.exports = Task;