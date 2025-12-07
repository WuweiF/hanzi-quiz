const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // 新增

const app = express();
const PORT = process.env.PORT || 3000;

// 新增：允许跨域
app.use(cors());

// 中间件
app.use(bodyParser.json());
app.use(express.static('public')); // 托管前端静态文件

// 数据存储文件
const DATA_FILE = './answer_records.json';
const CHAR_DATABASE_FILE = './char_database.json';

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// 接口：获取字库
app.get('/api/char-database', (req, res) => {
    if (fs.existsSync(CHAR_DATABASE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHAR_DATABASE_FILE, 'utf8'));
        res.json(data);
    } else {
        res.status(404).json({ error: '字库文件不存在' });
    }
});

// 接口：记录答题结果
app.post('/api/record-answer', (req, res) => {
    try {
        const record = {
            id: Date.now(),
            ...req.body,
            createTime: new Date().toISOString()
        };

        const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        records.push(record);
        fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));

        res.json({ success: true, message: '数据记录成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 接口：获取答题统计数据
app.get('/api/statistics', (req, res) => {
    try {
        const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const charDatabase = JSON.parse(fs.readFileSync(CHAR_DATABASE_FILE, 'utf8'));

        const charStats = {};
        charDatabase.forEach(char => {
            charStats[char.id] = {
                char: char.char,
                total: 0,
                correct: 0,
                rate: 0
            };
        });

        records.forEach(record => {
            if (charStats[record.charId]) {
                charStats[record.charId].total++;
                if (record.isCorrect) {
                    charStats[record.charId].correct++;
                }
                charStats[record.charId].rate = ((charStats[record.charId].correct / charStats[record.charId].total) * 100).toFixed(1);
            }
        });

        res.json({
            totalRecords: records.length,
            charStats: Object.values(charStats)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
