const multer = require('multer');
const {v4: uuidv4} = require('uuid');
const path=require('path');

const storage=multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4()+path.extname(file.originalname));
    }
});


// Add file filter to only accept images
const fileFilter = function (req, file, cb) {
    // Accept only images
    const allowed = ['image/jpeg', 'image/png','image/jpg'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG and PNG files are allowed'), false);
    
    }
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // Maximum number of files
    }
});

module.exports = upload;