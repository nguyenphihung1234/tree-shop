const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/treeShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Mongoose Schema cho cây
const treeSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
});

const Tree = mongoose.model('Tree', treeSchema);

// Cấu hình multer để upload hình ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên file thành thời gian hiện tại
    },
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Để client truy cập ảnh

// API thêm cây
app.post('/api/trees', upload.single('image'), async (req, res) => {
    try {
        const newTree = new Tree({
            name: req.body.name,
            description: req.body.description,
            image: `/uploads/${req.file.filename}`, // Lưu đường dẫn tới file hình ảnh
        });

        await newTree.save();
        res.status(201).json(newTree);
    } catch (error) {
        console.error('Error adding tree:', error);
        res.status(500).json({ message: 'Failed to add tree' });
    }
});

// API lấy tất cả cây
app.get('/api/trees', async (req, res) => {
    try {
        const trees = await Tree.find();
        res.json(trees);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch trees' });
    }
});

// API xóa cây
app.delete('/api/trees/:id', async (req, res) => {
    try {
        await Tree.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Tree deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete tree' });
    }
});
// API lấy một cây theo ID
app.get('/api/trees/:id', async (req, res) => {
    try {
        const tree = await Tree.findById(req.params.id);
        if (!tree) return res.status(404).json({ message: 'Tree not found' });
        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tree' });
    }
});

// API cập nhật cây
app.put('/api/trees/:id', upload.single('image'), async (req, res) => {
    try {
        const tree = await Tree.findById(req.params.id);
        if (!tree) return res.status(404).json({ message: 'Tree not found' });

        tree.name = req.body.name || tree.name;
        tree.description = req.body.description || tree.description;

        // Cập nhật ảnh mới nếu có
        if (req.file) {
            tree.image = `/uploads/${req.file.filename}`;
        }

        await tree.save();
        res.status(200).json(tree);
    } catch (error) {
        console.error('Error updating tree:', error);
        res.status(500).json({ message: 'Failed to update tree' });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
