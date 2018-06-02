const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const keys = require('../../config/key').secretOrKey;
const passport = require('passport');

// Load Input Validation
const validationRegisterInput = require('../../validation/register'); 
const validationLoginInput = require('../../validation/login');

//Load User Modal
const User = require('../../models/User')

// @route  GET api/users/test
// @desc   Tests users route
// @access Public 
router.get('/test', (req, res)=> res.json({mgs: "Users Works"}));

// @route  GET api/users/register
// @desc   Register user
// @access Public 
router.post('/register', (req, res) => {

    const { errors, isValid } = validationRegisterInput(req.body);
    
    //Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email }).then( user => {
        //console.log(user)
            if(user){
                errors.email = 'Email already exists';
                return res.status(400).json(errors);
            }else{
                const avatar = gravatar.url(req.body.email, {
                    s: '200', // Size
                    r: 'pg', // Rating
                    d: 'mm' // Default
                  });

                  const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar,
                    password: req.body.password
                  });
            

                  bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                      if (err) throw err;
                      newUser.password = hash;
                      newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                    });
                  });

            }
        })
})


// @route  GET api/users/login
// @desc   Login user
// @access Public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const { errors, isValid } = validationLoginInput(req.body);

    //Check Validation
    if(!isValid){
        return res.status(400).json(errors);
    }

    // Find user by email
    User.findOne({email})
        .then(user =>{
            //Check for user
            if(!user){
                errors.email = 'User not found';
                return res.status(404).json(errors);
            }
            //Check for Password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch){
                      //  res.json({mgs: 'Success'});  
                      // User Matched

                      const payload = { 
                        id: user.id, 
                        name: user.name, 
                        avatar: user.avatar 
                    }; // Created JWT Payload

                      // Sign Token
                      jwt.sign(
                        payload, 
                        keys, 
                        { expiresIn: 3600 }, 
                        (err, token)=>{
                            res.json({
                                success: true,
                                token: 'Bearer ' + token
                            })
                      });
                    } else {
                        errors.password = 'Password incorrect'
                        return res.status(404).json({password: 'Password incorrect'})
                    }
                })
        })
})


// @route  GET api/users/corrent
// @desc   Return current user
// @access Private
router.get('/corrent', passport.authenticate('jwt', {session: false }), (req, res) =>{
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
})

module.exports = router