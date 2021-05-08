const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const  { sendWelcomeEmail, sendEmailOnCancelation } = require('../emails/account');

const router = new express.Router();




// When posting the user either might be saved or might not. So response could be 201 (created) or 400 (bad request)
router.post('/users', async (req,res) => {
    
    const user = new User(req.body);
    
    try {
        await user.save(); 
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
    
});


router.post('/users/login', async (req, res) => {
   
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
        //res.status(200).send({ user:user.getPublicProfile(), token });
    } catch (error) {
        res.status(400).send(error);
    }
});


// Logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter( (item) => {
               return item.token !== req.token
        });
        await req.user.save();
        res.send.status(200).send('User is logged out!');
    } catch (error) {
        res.status(500).send(error);
    }
});

// Logout all sessions

router.post('/users/logoutAll', auth, async (req, res) => {
     
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200.).send('All devices are logout!');
    } catch (error) {
        res.status(500).send(error);
    }
});




// When getting users the response can be empty or not. So, response could be 200 (ok) or 500 (Internal server error)
router.get('/users/me', auth, async (req, res) => {
   // the req.user comes from the middleware 
    res.send(req.user);
            
});


router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name','email','password', 'age'];
    const isValidOperation = updates.every( update => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'});
    }

      
    try {
        // Getting a user by id from database
        //const user = await User.findById(req.user._id);
        // Updating fields coming from req.body
        updates.forEach( update => req.user[update] =  req.body[update]);

        await req.user.save();
       // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        // if(!user){
        //     return res.status(404).send();
        // }
        res.status(200).send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }

});


router.delete('/users/me', auth, async (req, res) => {

    try {
        // The req.user._id comes from the auth middleware
       // const user = await User.findByIdAndDelete(req.user._id);
       await req.user.remove();
       sendEmailOnCancelation(req.user.email, req.user.name);
       
       res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }

});


// Upload files

const upload = multer({
    // dest: 'avatars', // If this property is removed, multer will let the router process the information instead
     limits: {
         fileSize:1000000
     },
     fileFilter(req, file, cb){
        const regex = /\.(jpg|jpeg|png)$/;
        if(!file.originalname.match(regex)){
            return cb(new Error('Please provide a JPG, JPEG or PNG image!'))
        }
        cb(undefined, true);
     }
 });
 
 router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
     //req.user.avatar = req.file.buffer; // processing the files from multer and saving it in the database
     const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer();
     req.user.avatar = buffer;
     await req.user.save();
     res.send();
 }, (error, req,res,next) => {
      res.status(400).send({error: error.message});
 });


router.delete('/users/me/avatar',auth, async (req, res) => {
     req.user.avatar = undefined;
     await req.user.save();
     res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
     try {
         const user = await User.findById(req.params.id);
         if(!user || !user.avatar){
            throw new Error();
         }

         res.set('Content-Type','image/png');
         res.send(user.avatar);
     } catch (error) {
         res.status(404).send();
     }
});





module.exports = router;