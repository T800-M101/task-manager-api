const jwt = require('jsonwebtoken');
const User = require('../models/user');





const auth = async (req, res, next ) => {
    try {
        // Figure out if the user is authenticated
       const token = req.header('Authorization').replace('Bearer ','');
       // decode the token to extract the _id
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       // Find the user profile of the authenticated user
       const user = await User.findOne({_id: decoded._id, 'tokens.token':token});
       if(!user){
           throw new Error();
       }
       // assging the user profile to the request
       req.token = token;
       req.user = user;
       next();
           
    } catch (error) {
        res.status(401).send({error: 'Please authenticate!'});
    }
}



module.exports = auth;