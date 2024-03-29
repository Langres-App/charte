const express = require('express');
const { blobUpload } = require('../model/FileStore');
const { handle } = require('./functionHandler');
const router = express.Router();
const UserManager = require('../model/Managers/UserManager');
const { getSignedDocument } = require('../model/Managers/SignedDocumentManager');
const requireAuth = require('./authMiddleware');

/**
 * GET /users/archived
 * @description Get all archived users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the users are retrieved.
 */
router.get('/archived', requireAuth, handle(async (req, res) => {
    res.status(200).send(await UserManager.getArchived());
}));

/**
 * GET /users/:id
 * @description Get signed users by document ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the signed users are retrieved.
 */
router.get('/:id', handle(async (req, res) => {
    res.status(200).send(await UserManager.getByDocId(req.params.id));
}));

/**
 * GET /users(?email=:email)
 * @description Get user by email / get every users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the user is retrieved.
 */
router.get('', requireAuth, handle(async (req, res) => {

    let data;

    if (!req.query.email) {
        data = await UserManager.getAll();
        res.status(200).send(data);
        return;
    }

    data = await UserManager.getByEmail(req.query.email);
    res.status(200).send({ first_name: data.first_name, last_name: data.last_name });
}));

/**
 * GET /users/signingData/:token
 * @description Get signing data by token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the signing data is retrieved.
 */
router.get('/signingData/:token', handle(async (req, res) => {
    const data = await UserManager.getSigningPageData(req.params.token);
    res.status(200).send(data);
}));

/**
 * POST /users
 * @description Create a new user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the user is created.
 */
router.post('/', requireAuth, handle(async (req, res) => {

    if (req.body.identifier != undefined) {
        req.body.email = req.body.identifier;
    }

    await UserManager.add(req.body);
    res.status(200).send('User created successfully');
}));

/**
 * POST /unarchive/:id
 * @description Unarchive a specific user
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the user is updated.
 */
router.put('/:id/unarchive', requireAuth, handle(async (req, res) => {
    await UserManager.unarchive(req.params.id);
    res.status(200).send('User unarchived successfully');
}));

/**
 * DELETE /users/:id
 * @description Archive a user by user_version ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the user is archived.
 */
router.delete('/:id', requireAuth, handle(async (req, res) => {
    await UserManager.archive(req.params.id);
    res.status(200).send('User archived successfully');
}));

/**
 * DELETE /users/archived/:id
 * @description Delete a user by user_version ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the user is deleted.
 */
router.delete('/:id/archived', requireAuth, handle(async (req, res) => {
    await UserManager.deleteArchived(req.params.id);
    res.status(200).send('User deleted successfully');
}));

/**
 * POST /users/generateSigningToken
 * @description Generate a signing token for a user and document.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the signing token is generated.
 */
router.post('/generateSigningToken', requireAuth, handle(async (req, res) => {
    const token = await UserManager.generateSigningToken(req.body, req.body.documentId);
    res.status(200).send(token);
}));

/**
 * POST /users/sign/:token
 * @description Sign a document.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {void} - The response indicating that the endpoint is not implemented.
 */
router.post('/sign/:token', blobUpload.single('blob'), handle(async (req, res) => {

    // send the signed document
    const signedDoc = await UserManager.sign(req.params.token, req.file.buffer);

    // send the signed document as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachement; filename="${signedDoc.docName}"`);
    res.send(signedDoc.pdf);
}));

/**
 * DELETE /users/:userId/deleteAllSignatures/:docId
 * @description Delete all signatures for a specific document (not the waiting ones).
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the signatures are deleted.
 */
router.delete('/:userId/deleteAllSignatures/:docId', requireAuth, handle(async (req, res) => {
    // delete all signatures for a specific document (not the waiting ones)
    await UserManager.deleteSignatureByDocId(
        req.params.docId,
        req.params.userId
    );
    res.status(200).send('Signature deleted successfully');
}));

/**
 * DELETE /users/:userId/deleteSignaturesToken/:token
 * @description Delete a waiting signature by token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the waiting signature is deleted.
 */
router.delete('/:userId/deleteSignaturesToken/:token', requireAuth, handle(async (req, res) => {
    // delete the waiting signature (by its token)
    await UserManager.deleteSignatureByToken(
        req.params.token,
        req.params.userId
    );
    res.status(200).send('Signature deleted successfully');
}));

/**
 * GET /users/signedDocument/:id
 * @description Get a signed document by ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - The promise that resolves when the signed document is retrieved.
 */
router.get('/signedDocument/:id', requireAuth, handle(async (req, res) => {
    // get the signed document
    const signedDoc = await getSignedDocument(req.params.id);

    // send the signed document as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${signedDoc.docName}"`);

    res.send(signedDoc.pdf);
}));

module.exports = router;
