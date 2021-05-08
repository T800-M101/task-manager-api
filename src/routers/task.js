const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/task');




router.post('/tasks', auth, async (req, res) => {
    
    const task = new Task({
        ...req.body,
        owner:req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
    
});

// FILTERING - GET  /tasks?completed=true
// PAGINATION - GET /tasks?limit=10&skip=0     limit skip for pagination
// SORTING - GET /tasks?sortBy=createdAt:asc (1)   or /tasks?sortBy=createdAt:desc (-1) 
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed){
        //If the string coming in the request is not true, the boolean result of the condition will be false
        match.completed = req.query.completed === 'true';
    }
     
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            //The property natch is equal to the const match which contains the boolean value
            match, // filtering
            options: {
                limit: parseInt(req.query.limit), // pagination
                skip: parseInt(req.query.skip), // sorting
                sort

            }
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send();
    }


});


router.get('/tasks/:id', auth, async(req, res) => {
   
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id }); 
          
        if(!task){
            res.status(404).send();
          }

          res.status(200).send(task);
    } catch (error) {
        res.status(500).send();
    }
    
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description','completed'];
    const isValidOperation = updates.every( update => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'});
    }

    try {
        
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
       
        if(!task){
            return res.status(404).send();
        }

        updates.forEach( update => task[update] = req.body[update]);
        await task.save();
        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
        
    }

});


router.delete('/tasks/:id', auth, async (req, res) => {
      
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner:req.user._id});
        if(!task){
            return res.status(404).send();
        }
        res.status(200).send('Task was deleted!');
    } catch (error) {
        res.status(500).send(error);
    }
});




module.exports = router;