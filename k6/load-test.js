import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
    stages: [
        { target: 100, duration: '30s' },
        { target: 100, duration: '5m' },
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
        "load-test-results.html": htmlReport(data),
    };
}