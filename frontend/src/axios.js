import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8088', // Địa chỉ Backend Spring Boot của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

export default instance;