const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const jwt = require('jsonwebtoken');
const auth = require('./lib/auth');

var mysql = require('mysql');
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '0000',
    database : 'fintech'
})

connection.connect();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(path.join(__dirname, 'public')));//to use static asset

app.get('/main', function(Req, res) {
    res.render('main')
})

app.get('/design', function(req, res){
    res.render('wallet');
})

app.get('/signup', function(req, res){
    res.render('signup')
})

app.get('/login', function(req, res){
    res.render('login')
})

app.get('/balance', function(req, res){
    res.render('balance')
})

app.get('/qrcode', function(req, res){
    res.render('qrcode')
})

app.get('/qr', function(req, res) {
    res.render('qrReader')
})


app.get('/authResult', function(req, res){
    console.log('/authResult');
    var authCode = req.query.code;
    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        header : {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        form : {
            code : authCode,
            client_id : 'Gm8BUY1ijKBmJHEBYI4nW0cLbyTdZRmgKKk8FEy7',
            client_secret : 'CCG8UYaenq9DM91K9JGipcBbRbFsShBJalazRTct',
            redirect_uri : 'http://localhost:3000/authResult',
            grant_type : 'authorization_code'
        }
    }
    request(option, function (error, response, body) {
        if (error) {
          console.error(error);
          throw error;
        } else {
          var accessRequestResult = JSON.parse(body);
          console.log("in")
          console.log(accessRequestResult);
          res.render('resultChild', { data: accessRequestResult });
        }
      });
})

app.post('/signup', function(req, res){
    var userName = req.body.userName;
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;
    var userAccessToken = req.body.userAccessToken;
    var userRefreshToken = req.body.userRefreshToken;
    var userSeqNo = req.body.userSeqNo;
    // console.log(userAccessToken, userRefreshToken, userSeqNo)
    

    var sql = "INSERT INTO fintech.user"+
    " (name, email, password, accesstoken, refreshtoken, userseqno)"+
    " VALUES (?, ?, ?, ?, ?, ?)"

    connection.query(sql, [userName, userEmail, userPassword, userAccessToken, userRefreshToken, userSeqNo], function (err, results, fields) {
        if (err) throw err;
        res.json('가입완료')
    })


})



app.post('/login', function(req, res){
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;

    //console.log(req.body);
    var userEmail = req.body.userEmail;
    var userPassword = req.body.userPassword;

    var sql = "SELECT * FROM fintech.user WHERE email = ?";
    connection.query(sql, [userEmail], function(error, result){
        if (error) throw error;
        if(result.length == 0){
            res.json('사용자가 없습니다.')
        }
        else {
            var dbPassword = result[0].password;
            console.log('database password : ', dbPassword);
            if(dbPassword == userPassword){
                console.log('login 성공!');
                jwt.sign(
                    { 
                        userId : result[0].id,
                        userName : result[0].name
                    },  //payload
                    'fi&4nt%dnn2nw1ooec@hse#rvice!1234#', 
                    {
                        expiresIn : '1d',
                        issuer : 'fintech.admin',
                        subject : 'user.login.info'
                    },
                    function(err, token) {
                        console.log('우리가 발급한 토큰 : ',token);
                        res.json(token);
                    }
                );                   
            }
            else if(dbPassword != userPassword) {
                res.json('패스워드가 다릅니다');
            }
        }
    })
})

app.get('/authTest', auth, function(req, res){
    res.json(req.decoded);
})

app.post('/list', auth, function(req, res){
    var userId = req.decoded.userId;
    var sql = "SELECT * fROM user WHERE id = ?";
    connection.query(sql, [userId], function(err, result) {
        if(err) throw err;
        var accesstoken = result[0].accesstoken;
        var userseqno = result[0].userseqno;
        //  console.log('(/list) < db에서 가져온 값 >  \n', accesstoken, userseqno);

        // var AT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzU5ODgwIiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE2MDAyMzA4ODAsImp0aSI6ImQyMjlhMmJhLWFlNmUtNDk3Ny1iYTVkLTVmODFiNDkxYzhhOCJ9.2W1hRaBh0wwIyvpplQ_drtQVpfUHLSL_FihhIEv17U8'
        var option = {
            method : "GET",
            url : "https://testapi.openbanking.or.kr/v2.0/user/me",
            headers : {
                'Authorization' : 'Bearer ' + accesstoken
            },
            qs : {
                user_seq_no : userseqno // '1100759880'
            }
        }
        request(option, function (error, response, body) {
            // console.log('(/list) < body >  \n ', body);
            var requestResultJSON = JSON.parse(body);
            res.json(requestResultJSON)
        });
    })
    
})

app.post('/balance', auth, function(req, res) {
    var finusenum = req.body.fin_use_num;
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = 'T991637250U' + countnum
    var dtime = '20200714141121'
    console.log("in")
    // DB 조회

    var userId = req.decoded.userId;
    var sql = "SELECT * fROM user WHERE id = ?";
    connection.query(sql, [userId], function(err, result) {
        if(err) throw err;
        var accesstoken = result[0].accesstoken;
        console.log(accesstoken)
        
        var userseqno = result[0].userseqno;
        console.log('(/balance) < db에서 가져온 값 >  \n', accesstoken, userseqno);
        
        //  잔액조회 request
        
        var option = {
            method : "GET",
            url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
            headers : {
                "Content-Type": "application/x-www-form-urlencoded",
                'Authorization' : 'Bearer ' + accesstoken
            },
            qs : {
                bank_tran_id : transId,
                fintech_use_num : finusenum,
                tran_dtime : dtime
            }
        }
        request(option, function (error, response, body) {
            console.log('(/balance) < body >  \n ', body);
            var requestResultJSON = JSON.parse(body);
            res.json(requestResultJSON)
        });
    })

})

app.post('/transactionlist', auth, function(req, res) {
    var finusenum = req.body.fin_use_num;
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    console.log(countnum)
    var transId = 'T991637250U' + countnum
    var dtime = '20200618141121'
    console.log("in")
    // DB 조회

    var userId = req.decoded.userId;
    var sql = "SELECT * fROM user WHERE id = ?";
    connection.query(sql, [userId], function(err, result) {
        if(err) throw err;
        var accesstoken = result[0].accesstoken;
        var userseqno = result[0].userseqno;
        console.log('(/transactionlist) < db에서 가져온 값 >  \n', accesstoken, userseqno);
        
        //  잔액조회 request
       
        var option = {
            method : "GET",
            url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
            headers : {
                'Authorization' : 'Bearer ' + accesstoken
            },
            qs : {
                bank_tran_id : transId,
                fintech_use_num : finusenum,
                tran_dtime : dtime,
                inquiry_type : 'A',
                inquiry_base : 'D',
                from_date : '20200608',
                to_date : '20200617',
                sort_order : 'D',
                tran_dtime : dtime,

            }
        }
        request(option, function (error, response, body) {
            console.log('(/transactionlist) < body >  \n ', body);
            var requestResultJSON = JSON.parse(body);
            res.json(requestResultJSON)
        });
    })

})

app.post('/withdraw', auth, function(req, res) {
    var finusenum = req.body.fin_use_num;
    var countnum = Math.floor(Math.random() * 1000000000) + 1;
    var transId = 'T991637250U' + countnum
    var dtime = '20200618141121'
    accesstoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxMTAwNzU5ODgwIiwic2NvcGUiOlsiaW5xdWlyeSIsImxvZ2luIiwidHJhbnNmZXIiXSwiaXNzIjoiaHR0cHM6Ly93d3cub3BlbmJhbmtpbmcub3Iua3IiLCJleHAiOjE2MDAyMzA4ODAsImp0aSI6ImQyMjlhMmJhLWFlNmUtNDk3Ny1iYTVkLTVmODFiNDkxYzhhOCJ9.2W1hRaBh0wwIyvpplQ_drtQVpfUHLSL_FihhIEv17U8'
    var option = {
        method : "POST",
        url : "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
        headers : {
            'Authorization' : 'Bearer ' + accesstoken,
            'Content-Type' : "application/json"
        },
        json : {
            "bank_tran_id": transId, 
            "cntr_account_type": "N",
            "cntr_account_num": "3131377530",
            "dps_print_content": "쇼핑몰환불",
            "fintech_use_num": "199163725057884787356387",
            "wd_print_content": "오픈뱅킹출금",
            "tran_amt": "10000",
            "tran_dtime": "20200619101921", 
            "req_client_name": "홍길동", 
            "req_client_bank_code": "097", 
            "req_client_account_num": "1101230000678",
            "req_client_num" : "KIMHYEJI123456",
            "transfer_purpose": "TR",
            "sub_frnc_name": "",
            "sub_frnc_num": "",
            "sub_frnc_business_num": "1234567890",
            "recv_client_name": "김혜지",
            "recv_client_bank_code": "097", 
            "recv_client_account_num": "3131377530"
            }
    }
    request(option, function(err, response, body){
        if(err){
            console.error(err);
            throw err;
        }
        else {
            console.log(body);
            if(body.rsp_code == 'A0000'){
                res.json(1)
            }
        }
    })
})

app.listen(3000)

