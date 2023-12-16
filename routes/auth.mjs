import express from 'express';
import mongoClient from './../mongodb.mjs'
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { stringToHash, varifyHash, verifyHash } from 'bcrypt-inzi';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';



////////////////////////////////////////////////////////////////
/* Sates */
////////////////////////////////////////////////////////////////



let router = express.Router();
let dbName = 'UtophoriaNetwork';
let db = mongoClient.db(dbName);
let userCollection = db.collection('registered-users');
let otpCollection = db.collection('all-otp');
let connectMessage = 'Mongo Atlas Connected Successfully';
let disconnectMessage = 'Mongo Atlas *Disconnected* Successfully';



////////////////////////////////////////////////////////////////
/* Signup API */
////////////////////////////////////////////////////////////////


router.post('/signup', async(req, res)=>{



    try{
    console.log('Signup request received @:' + new Date());
    req.body.email = req.body.email.toLowerCase();


    if (
        (req.body.email.trim().length == 0) || (req.body.password.trim().length == 0) || (req.body.username.trim().length == 0)
    ) {
        res.status(403).send(`required parameters missing`);
        return;
    }

  

        await mongoClient.connect();
        console.log(connectMessage);

        // const filter = { email: req.body.email, username: req.body.username };
        const filter = {
            $or: [
              { email: req.body.email },
              { username: req.body.username }
            ]
          };
        const findDoc = await userCollection.findOne(filter);

        if(findDoc){

            if(findDoc.username == req.body.username && findDoc.email == req.body.email){

                res.status(409).send({
                    message:`Email and Username already in use`,
                });
    
            } else if(findDoc.username == req.body.username){

            res.status(409).send({
                message:`Username already exists`,
            });

            } else{
                res.status(409).send({
                    message:`Email already exists`,
                });
            }

            console.log("User Already Exists: ", findDoc)
            await mongoClient.close();
            console.log(disconnectMessage);
            return;

        }

        if(!findDoc) {


            const passwordHash = await stringToHash(req.body.password);
            let userInfo = {

                email: req.body.email,
                password: passwordHash,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
                createdOn: new Date(),

            };

            const insertResponse = await userCollection.insertOne(userInfo);

            console.log("User created: ", insertResponse);
            res.status(200).send({
                message: "User created!",
            });
            await mongoClient.close();
            console.log(disconnectMessage);


        }



    }catch(e){

        console.log("ERROR: " + e);
        res.status(500).send(`Internal Server Error`);
        await mongoClient.close();
        console.log(disconnectMessage);



    }


});


////////////////////////////////////////////////////////////////
/* Login API */
////////////////////////////////////////////////////////////////



router.post('/login', async(req, res)=>{

    try{

        if (!req.body?.email || !req.body?.password) {

            res.status(403);
            res.send(`required parameters missing, 
            example request body:
            {
                email: "some@email.com",
                password: "some$password",
            } `);
            return;

        }

        req.body.email = req.body.email.toLowerCase();
        await mongoClient.connect();
        let findUser = await userCollection.findOne({ email: req.body.email });
        console.log(findUser);

        if(!findUser){

            res.status(403).send({
                message: "email or password incorrect"
            });

            return;

        }
        if(findUser){

            const passwordVerification = await varifyHash(req.body.password, findUser.password);

                if(passwordVerification){

                    const JSONtoken = jwt.sign(
                        {
                        isAdmin: findUser.isAdmin,
                        firstName: findUser.firstName,
                        lastName: findUser.lastName,
                        username: findUser.username,
                        email: findUser.email,
                        _id: findUser._id,},
                        
                        process.env.SECRET,

                        {
                        expiresIn: '72h',
                        }
                        );       

                        res.cookie('authenticationtoken', JSONtoken,{
                            httpOnly: true,
                            // secure: true,
                            expires: new Date(Date.now() + 259200000),
                            // sameSite: 'None',
                        });

                        res.send({
                            message: "login successful",
                            data: {
                                isAdmin: findUser.isAdmin,
                                firstName: findUser.firstName,
                                lastName: findUser.lastName,
                                username: findUser.username,
                                email: findUser.email,
                                _id: findUser._id,
                            }
                        });

                        await mongoClient.close();
                        return;
                
                
                
                
                }else{

                    res.status(401).send({
                        message: "Email or password incorrect",
                    })
                    await mongoClient.close();
                    return;
                }


        }



    }catch(e){

        console.log("Error: " + e)
        res.status(500).send({
            message: "Internal Server Error",
        });
        await mongoClient.close();


    }

})


////////////////////////////////////////////////////////////////
/* Logout API */
////////////////////////////////////////////////////////////////


router.post('/logout', async(req, res)=>{

    res.clearCookie('authenticationtoken')
    res.status(200).send({ message: 'Logout Successful' })

});



////////////////////////////////////////////////////////////////
/* Forgot Password */
////////////////////////////////////////////////////////////////


router.post('/forgotPassword/:email', async(req, res)=>{

    try{

        let email = req.params.email;
        console.log("Email for OTP: ", email);
        await mongoClient.connect();
        console.log(connectMessage);
        let findUser = await userCollection.findOne({ email: email });
        if(!findUser){
            res.status(404).send({
                message: "User not found",
            });
            await mongoClient.close();
            console.log(disconnectMessage);
            return;
        }

        let theOTP = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        console.log("\n\n********************************")
        console.log("OTP: ", theOTP);
        console.log("********************************\n\n")

        const otpCodeHash = await stringToHash(theOTP);

        console.log("\n\n********************************")
        console.log("OTP Hash: ", otpCodeHash);
        console.log("********************************\n\n")

        const insertResponse = await otpCollection.insertOne({
            email: req.body.email,
            otpCodeHash: otpCodeHash,
            createdOn: new Date()
        });
        console.log("insertResponse: ", insertResponse);

        res.send({ message: 'OTP sent to email' });




    }catch(e){


    }

}); 



////////////////////////////////////////////////////////////////
/* Exporting ROUTER */
////////////////////////////////////////////////////////////////



export default router;

