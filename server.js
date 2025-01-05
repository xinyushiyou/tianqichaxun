const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 托管静态文件

// 天气 API 密钥
const WEATHER_API_KEY = process.env.OPEN_WEATHER_KEY;

// 天气数据缓存
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

// 获取天气数据
app.get('/api/weather/:city', async (req, res) => {
    try {
        let { city } = req.params;
        
        // 处理城市名称
        city = decodeURIComponent(city).trim();
        
        // 检查缓存
        const cachedData = weatherCache.get(city);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json(cachedData.data);
        }

        // 调用天气 API
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},CN&appid=${WEATHER_API_KEY}&units=metric&lang=zh_cn`
        );

        // 缓存数据
        weatherCache.set(city, {
            timestamp: Date.now(),
            data: response.data
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({
            error: '获取天气数据失败',
            message: error.message
        });
    }
});

// 获取空气质量数据
app.get('/api/air-quality/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching air quality:', error);
        res.status(500).json({
            error: '获取空气质量数据失败',
            message: error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 