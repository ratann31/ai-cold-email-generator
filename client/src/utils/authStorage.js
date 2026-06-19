export const AUTH_USER_KEY = 'userInfo';
export const AUTH_TOKEN_KEY = 'token';

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUser = () => {
    const userInfo = localStorage.getItem(AUTH_USER_KEY);

    if (!userInfo) {
        return null;
    }

    try {
        return JSON.parse(userInfo);
    } catch (error) {
        clearStoredAuth();
        return null;
    }
};

export const setStoredAuth = (userData) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    localStorage.setItem(AUTH_TOKEN_KEY, userData.token);
};

export const clearStoredAuth = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
};
