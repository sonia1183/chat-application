const passport =require('passport');
const LocalStrategy = require('passport-local').Strategy;
const ChatUser = require('../models/chatUser');

passport.use(new LocalStrategy({
    usernameField :'email'
},
    function(email,password,done){
        ChatUser.findOne({email:email},function(err,user){
            if(err){
                console.log('error found');
                return;
            }
            if(!user || user.password != password){
                console.log('Invalid User');
                return done(null,false);
            }
            return done(null,user);
        })
    }
));

passport.serializeUser(function(user,done){
    done(null,user.id);
})

passport.deserializeUser(function(id,done){
    ChatUser.findById(id,function(err,user){
        if(err){
            console.log('error');
            return;
        }
        return done(null,user);
    })
})

passport.checkAuthentication=function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    return res.redirect('/');
}

passport.setAuthenticatedUser=function(req,res,next){
    if(req.isAuthenticated){
        res.locals.user=req.user;
    }
    next();
}

module.exports = passport;