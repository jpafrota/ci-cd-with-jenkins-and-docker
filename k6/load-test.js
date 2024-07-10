import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
    stages: [
        { target: 15, duration: '30s' },
        { target: 30, duration: '2m' },
        { target: 0, duration: '1m' }
    ],
    thresholds: {
        checks: ['rate > 0.99'],
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate < 0.02']
    }
}

export function setup() {
    const loginRes = http.post(`${__ENV.BASE_URL}/auth/login`, {
        email: 'jpaf@icomp.ufam.edu.br',
        password: '12345678'
    });

    const token = loginRes.json('access_token');
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

    sleep(1);
}

export function handleSummary(data) {
    return {
        'load-test-results.txt': textSummary(data, { indent: ' ', enableColors: false })
    };
}