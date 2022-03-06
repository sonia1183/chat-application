const PORT = 4000;

const express = require('express');
const cookieParser = require('cookie-parser');

const passport= require('passport');
const passportLocal = require('./config/passport-local');


const path = require('path');


const app = express();
const session = require('express-session');

app.set('view engine','ejs');
app.use(express.static('./assets'));
app.set('views',path.join(__dirname,'views'));

const database=require('./config/mongoose');
const ChatUser = require('./models/chatUser');
const MongoStore = require('connect-mongo');

const server = require('http').createServer(app);
const io= require('socket.io')(server,{cors:{origin:'*'}})

app.use(express.urlencoded({extended:true}));
app.use(cookieParser()); //middleware

app.use(session({
    name: 'login',
    secret:'xyz',
    saveUninitialized : false,
    resave : false,
    cookie: {
        maxAge: (100 * 60 * 1000)
    },
    //connecting mongo store
    store : MongoStore.create({
        mongoUrl:'mongodb://localhost:27017/login',
        mongooseConnect: database,
        autoRemove : 'disable' //session can't be removed automatically
     })
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.setAuthenticatedUser);

app.get('/',function(req,res){
    return res.render('home');
})

app.get('/login',function(req,res){
    return res.render('login');
})

// app.post('/userLogin',function(req,res){
//     ChatUser.findOne({email : req.body.email},function(err,user){
//         if(err){
//             console.log("error found");
//             return;
//         }
//         if(user){
//             if(user.password != req.body.password){
//                 return res.redirect('back');
//             }

//             // res.cookie('name',user.name);
//             let username=user.name;
//             res.redirect('/chatRoom/'+username);
//         }
//         else{
//             return res.redirect("back");
//         }
//     })
// })       

app.post('/userLogin',
passport.authenticate(
    'local',
    {failureRedirect: '/signup'}
    ),function(req,res){
    return res.redirect('/chatRoom')
})

app.get('/signup',function(req,res){
    if(req.isAuthenticated()){
        return res.redirect('/chatRoom');
     }
     //console.log(req.cookies);
     return res.render('signup');
})

app.post('/userCreate',function(req,res){
    if(req.body.password != req.body.confirm_password){
        console.log("Password not matched");
        return res.redirect('back'); 
    }
    ChatUser.findOne({email : req.body.email},function(err,user){
        if(err){
            console.log("error found");
            return;
        }
        if(!user){
            ChatUser.create(req.body,function(err,user){
                console.log(req.body);
                if(err){
                    console.log("error found");
                    return;
                }
                return res.redirect('/login')
                })
            }
            else{
                return res.redirect('back');
            }
    })
})

app.get('/chatRoom',passport.checkAuthentication,function(req,res){
    return res.render('chat_box');
})


app.get('/logout',function(req,res){
     req.logOut(); 
     return res.redirect('/');
})




server.listen(PORT,function(err){
    if(err){
        console.log(err);
        return;   
     }
        console.log("Server is running on port",PORT)
})

io.on('connection',(socket)=>{
    console.log('Token',socket.id);
    socket.on('message',(data)=>{
        socket.broadcast.emit('message',data);
    })
})
