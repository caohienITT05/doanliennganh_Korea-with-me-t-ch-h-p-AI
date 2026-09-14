import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8088', // Địa chỉ Backend Spring Boot của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});
// Tự động gắn Token xác thực vào Header của mọi request
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default instance;