import axios, {AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios';
import {jwtDecode} from 'jwt-decode';
import {LoginData} from "../../typing/auth/login";
import {Join} from "../../typing/auth/signup";
import {API_URL} from "../../api/api";

const api = axios.create({ baseURL: API_URL });

// 401 에러 처리
api.interceptors.request.use(
    function (request) {
        return request;
    },
    async function (error: AxiosError) {
        if (error.response && error.response.status === 401) {
            try {
                let errorConfig: AxiosRequestConfig = error.config || {};
                const { data } = await axios.post(`${API_URL}/access/refresh`);
                if (data) {
                    const { access } = data;
                    localStorage.removeItem('every-pet-ceo-access');
                    localStorage.setItem('every-pet-ceo-access', access);
                    if (errorConfig.headers) {
                        errorConfig.headers['Authorization'] = `Bearer ${access}`; // 새로운 토큰으로 헤더 업데이트
                    } else {
                        errorConfig.headers = { Authorization: `Bearer ${access}` }; // 헤더가 없는 경우 새로 생성
                    }
                    return axios.request(errorConfig); // 기존 요청 재시도
                }
            } catch (e) {
                localStorage.removeItem('every-pet-ceo-access');
                throw e;
            }
        }
        return Promise.reject(error);
    }
);

export const login = async ({ memberId, memberPwd }: LoginData): Promise<any> => {
    const data = { memberId, memberPwd };

    try {
        const response: AxiosResponse<any> = await api.post(`${API_URL}/signin`, data);

        const access = response.headers['access'];
        const decodedToken: any = jwtDecode(access);
        const username = decodedToken.username;

        return {
            access: access,
            user: username
        };

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
            console.error("Error response headers:", error.response.headers);
        } else {
            console.error("Error during login:", error);
        }
        throw error;
    }
};

export const signUpLogin = async (user: Join): Promise<any> => {
    try {
        const response: AxiosResponse<any> = await api.post(`${API_URL}/member/signup`, user);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
            console.error("Error response headers:", error.response.headers);
        } else {
            console.error("Error during signup:", error);
        }
        throw error;
    }
};

export const sendVerificationEmail = async ({ purpose, to }: { purpose: string; to: string }): Promise<{ success: boolean }> => {
    const data = { purpose, to };
    const response = await api.post(`${API_URL}/send-mail/code`, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
};

export const verifyCode = async ({ purpose, code }: { purpose: string; code: string; }): Promise<{ success: boolean }> => {
    const data = { purpose, code };
    const response = await api.post(`${API_URL}/send-mail/code/verify`, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.data;
};

// 비밀번호 찾기
export const passwordFind = async ({ email, memberId }: { email: string, memberId: string }) => {
    const data = { email, memberId };
    const response = await api.post(`${API_URL}/member/password/reset`, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};
