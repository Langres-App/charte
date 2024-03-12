/**
 * @class UserManager - A class to manage the users.
 */
class UserManager {

    /**
     * The user data access object.
     * @private
     */
    #userDao;

    /**
     * Represents a UserManager object.
     * @constructor
     */
    constructor() {
        this.#userDao = new UserDao();
    }


    /**
     * Adds a user to the system.
     * @param {Object} user - The user object to be added.
     * @returns {Promise} A promise that resolves with the added user.
     */
    async addUser(user) {
        return await this.#userDao.add(user);
    }

    /**
     * Retrieves all users associated with a given document ID.
     * 
     * @param {string} docId - The ID of the document.
     * @returns {Promise<Array<SignedUser>>} - A promise that resolves to an array of SignedUser objects.
     */
    async getAllByDocId(docId) {
        const toReturn = [];

        // get the users
        let users = await this.#userDao.getById(docId);

        // create the signed users and add them to the list
        users.forEach(user => {
            toReturn.push(new SignedUser(user.id, user.displayName, user.version_date, user.signed_date)); 
        });

        return toReturn;
    }

    /**
     * Retrieves a user by their email.
     * @param {string} email - The email of the user.
     * @returns {Promise<User|null>} - A promise that resolves to the user object if found, or null if not found.
     */
    async getByEmail(email) {
        try {
            return await this.#userDao.getByEmail(email);
        } catch (_) {
            return null;
        }
    }

    async getDocAndUserName(token) {
        try {
            return await this.#userDao.getDocAndUserName(token);
        } catch (_) {
            window.location.href = '/charte';
        }
    }

    /**
     * Generates a signing link for the given user.
     * @param {Object} body - The user data.
     * @param {string} body.email - The email of the user.
     * @returns {Promise<string>} The signing link.
     */
    async generateSigningLink(body) {
        if (!this.links) this.links = [];

        let link = this.links[body.email];

        if (!link) {
            link = await (await this.#userDao.generateSigningLink(body)).text();
            this.links[body.email] = link;
        }

        return window.location.origin + '/charte/visual/pages/signing.html?token=' + link;
        
    }

    async signDocument(token, blob) {
        const response = await this.#userDao.signDocument(token, blob);
        if (response.status !== 200) {
            throw new Error('Error signing the document');
        }

        return await response.blob();
    }

    /**
     * Prints the PDF document with the user signature.
     * @param {string} docId - The ID of the document.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<void>} - A promise that resolves when the PDF document is printed.
     */
    async print(docId, userId) {
        let url = await this.#userDao.print(docId, userId);
        // open a new window to show the pdf document with the user signature
        window.open(url + '?doc=' + docId + '&user=' + userId, '_blank');
    }

    /**
     * Archives a user so that he doesn't appear when looking for people who signed a document. (soft delete)
     * @param {string} userId - The ID of the user to archive.
     * @returns {Promise} A promise that resolves when the user is archived.
     */
    async archive(userId) {
        return await this.#userDao.archive(userId);
    }
}