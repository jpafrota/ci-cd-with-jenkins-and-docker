import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
    vus: 1,
    duration: '3s',
    thresholds: {
        checks: ['rate > 0.99']
    }
}

export function setup() {
    const loginRes = http.post(`${__ENV.BASE_URL}/auth/login`, {
        email: 'jpaf@icomp.ufam.edu.br',
        password: '12345678'
    });

    const token = loginRes.json('access_token');
    console.log(token)
    return token;
}

export default function (token) {

    const params = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }

    const res = http.get(`${__ENV.BASE_URL}/monitor/all`, params);

    check(res, {
        'status code 200': (r) => r.status === 200
    });

    console.log(res.status)

    sleep(1);
}

export function handleSummary(data) {
    return {
        'smoke-test-results.txt': textSummary(data, { indent: ' ', enableColors: false })
    };
}