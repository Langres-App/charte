/**
 * Represents a data access object for authentication operations.
 * @extends Dao
 */
class AuthDao extends Dao {
    /**
     * Represents the constructor of the AuthDao class.
     * @constructor
     */
    constructor() {
        super('auth');
    }

    /**
     * Checks for an existing user.
     * @returns {Promise} A promise that resolves with the result of the check.
     */
    async checkForExistingUser() {
        return await this.get('/check');
    }

    /**
     * Logs in a user.
     * @param {Object} user - The user object containing login credentials.
     * @returns {Promise} A promise that resolves with the login response.
     */
    async login(user) {
        let resp = await this.post('/login', user);
        if (resp.status === 200) {
            return await resp.text();
        }   
    }

    /**
     * Logs out the user.
     * @returns {Promise} A promise that resolves when the user is logged out.
     */
    async logout() {
        return await this.get('/logout');
    }

    /**
     * Registers a user.
     * @param {Object} user - The user object.
     * @returns {Promise} A promise that resolves with the result of the registration.
     */
    async register(user) {
        let resp = await this.post('/register', user);
        if (resp.status === 201) {
            return await resp.text();
        }
    }

    /**
     * Retrieves data from the specified URL.
     * @param {string} urlParam - The URL parameter.
     * @returns {Promise<any>} - A promise that resolves to the retrieved data.
     */
    async get(urlParam) {
        const response = await fetch(super.getUrl() + super.getEndpoint() + urlParam, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + AuthManager.getToken()
            }

        });
        return response;
    }

    /**
     * Sends a POST request to the specified URL with the provided user data.
     * @param {string} urlParam - The URL parameter for the request.
     * @param {object} user - The user data to be sent in the request body.
     * @returns {Promise<object>} - A promise that resolves to the response data.
     */
    async post(urlParam, user) {
        const response = await fetch(super.getUrl() + super.getEndpoint() + urlParam, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AuthManager.getToken()
            },
            body: JSON.stringify(user)
        });

        return response;
    }
}