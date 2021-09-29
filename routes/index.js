var express = require('express');
var multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
var empModel = require('../modules/employee');
var uploadModel = require('../modules/upload');


var router = express.Router();
var employee = empModel.find({});
var imageData = uploadModel.find({});

router.use(express.static(__dirname+ "./public/"));

if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

var Storage = multer.diskStorage({
   destination:"./public/uploads/",
   filename:(req,file,cb)=>{
     cb(null,file.fieldname+"_"+ Date.now()+path.extname(file.originalname));
   }
});

var upload = multer({
    storage:Storage
}).single('file');

router.post('/upload', upload ,function(req, res, next) {
  var imageFile=req.file.filename; 

  var success = req.file.filename+ "uploaded successfully"; 

  var imageDetails = new uploadModel({
    imagename:imageFile
  });

  imageDetails.save(function(err,doc){
    if(err) throw err;

    imageData.exec(function(err,data){
      if(err) throw err;
      res.render('upload-file', { title: 'Upload File', records:data , success: success });
    });

  });
  
});

function checkLogin(req,res,next){
  var myToken= localStorage.getItem('myToken');
  try {
    jwt.verify(myToken, 'loginToken');
  } catch(err) {
    res.send("you need to login first");
  }
  next();
}


router.get('/upload', function(req, res, next) {

  imageData.exec(function(err,data){
    if(err) throw err;
    res.render('upload-file', { title: 'Upload File', records:data , success:'' });
  });
});



/* GET home page. */
router.get('/',checkLogin,function(req, res, next) {

  employee.exec(function(err,data){
    if(err) throw err;
    res.render('index', { title: 'Employee Records', records:data , success:'' });
  });
  
});

router.get('/login', function(req, res, next) {
  var token = jwt.sign({ foo: 'bar' }, 'loginToken');
  localStorage.setItem('myToken', token);
  res.send("Login Successfully");
  
});

router.get('/logout', function(req, res, next) {
  localStorage.removeItem('myToken');
  res.send("logout successfully");
  
});

router.post('/', function(req, res, next) {
  var empDetails = new empModel({
    name: req.body.uname,
    email: req.body.email,
    etype: req.body.emptype,
    hourlyrate: req.body.hourlyrate,
    totalHour: req.body.totalhours,
    total: parseInt(req.body.hourlyrate) * parseInt(req.body.totalhours),
  });
  
  empDetails.save(function(err,res1){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data , success:'Record Inserted Successfully' });
    });
  });
  
});

router.post('/search/', function(req, res, next) {

  var fltrName = req.body.fltrname;
  var fltrEmail = req.body.fltremail;
  var fltrEmpType = req.body.fltremptype;

  if(fltrName != '' && fltrEmail != '' && fltrEmpType != ''){

    var filterParameter={ $and:[{ name:fltrName },
      { $and:[{email:fltrEmail},{etype:fltrEmpType}]}
    ]
    }
  }else if(fltrName != '' && fltrEmail == '' && fltrEmpType != ''){

    var filterParameter={ $and:[{ name:fltrName },{etype:fltrEmpType}]
    }
  }else if(fltrName == '' && fltrEmail != '' && fltrEmpType != ''){

    var filterParameter={ $and:[{ email:fltrEmail },{etype:fltrEmpType}]
    }
  }else if(fltrName == '' && fltrEmail == '' && fltrEmpType != ''){

    var filterParameter={etype:fltrEmpType
    } 
  }else{
    var filterParameter={}
  }
  var employeeFilter = empModel.find(filterParameter);
  
  
  
    employeeFilter.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data, success:'' });
    });
  
});

router.get('/delete/:id', function(req, res, next) {  
  
  var id=req.params.id;
  var del= empModel.findByIdAndDelete(id);

  del.exec(function(err,data){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data , success:'Record Deleted Successfully' });
    });
  });
  
});

router.get('/edit/:id', function(req, res, next) {

  var id=req.params.id;
  var edit= empModel.findById(id);

  edit.exec(function(err,data){
    if(err) throw err;
    res.render('edit', { title: 'Edit Employee Records', records:data });
  });
  
});

router.post('/update/', function(req, res, next) {

  
  var update= empModel.findByIdAndUpdate(req.body.id,{
    name: req.body.uname,
    email: req.body.email,
    etype: req.body.emptype,
    hourlyrate: req.body.hourlyrate,
    totalHour: req.body.totalhours,
    total: parseInt(req.body.hourlyrate) * parseInt(req.body.totalhours),
  });

  update.exec(function(err,data){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data , success:'Record Updated Successfully' });
    });
  });
  
});

module.exports = router;
