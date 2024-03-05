const { getSigningUserImage, getSigningUserData } = require('../data/queries/UsersQueries');
const assert = require('./Asserter');
const textToImage = require('text-to-image');
const Canvas = require('canvas');
const sharp = require('sharp');

/**
 * Retrieves the signature image for a given ID and combines it with a signature header.
 * @param {string} id - The ID of the signature.
 * @returns {Promise<Buffer>} - A promise that resolves to the combined image as a buffer.
 * @throws {Error} - If an error occurs while retrieving or processing the images.
 */
async function getSignature(id) {
    try {
        // get the signature's header and the signature images
        const header = await getSignatureHeader(id);
        const imgBuffer = await getSignatureImage(id);

        // get the metadata of the images
        const { width, height } = await sharp(imgBuffer).metadata();
        const { width: headerWidth, height: headerHeight } = await sharp(header).metadata();

        // calculate the new width and height of the image
        const newWidth = Math.max(width, headerWidth);
        const newHeight = height + headerHeight;

        // create a new image with the header and the image
        const img = await sharp({
            create: {
                width: newWidth,
                height: newHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).composite([
            { input: header, left: 0, top: 0 },
            { input: imgBuffer, gravity: 'south' },
        ])
            .png()          // used to allow transparency
            .toBuffer();    // convert the image to a buffer (to be sent as a response)

        return img;
    } catch (e) {
        console.log(e.message);
        throw new Error(e.message);
    }

}

/**
 * Retrieves the signature header for a user.
 * @param {string} id - The ID of the user.
 * @returns {Promise<Buffer>} The signature header as a Buffer object.
 */
async function getSignatureHeader(id) {

    // get the user's data
    const { displayName, signed_date } = await getSigningUserData(id);

    // format the date
    const date = new Date(signed_date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // set the parameters for the text to be generated
    const textParams = {
        maxWidth: 0,
        lineHeight: 30,
        fontSize: 24,
        fontFamily: 'Arial',
        margin: 5,
        textColor: 'black',
        bgColor: 'transparent'
    };

    // get text width of a text variable
    const canvas = Canvas.createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    ctx.font = `${textParams.fontSize}px ${textParams.fontFamily}`;

    // Set the text to be generated
    const text = `${displayName},\nFait le ${date}`;
    const textWidth = ctx.measureText(text).width + 10;

    // Set the max width of the text to the width of the text to be generated
    textParams.maxWidth = textWidth;

    // Generate the SVG overlay
    const dataUri = await textToImage.generate(text, textParams);

    // Create a new image with the SVG overlay 
    const result = await sharp(Buffer.from(dataUri.split(',')[1], 'base64')).toBuffer();

    return result;

}

/**
 * Retrieves the signature image for a user based on the provided ID.
 * @param {number} id - The ID of the user.
 * @returns {Promise<Buffer>} - A promise that resolves to a Buffer containing the signature image.
 */
async function getSignatureImage(id) {
    // verify the id is a number
    assert(id, 'id must be provided');
    id = Number(id);
    assert(Number(id), 'id must be a number');

    // get the image from the user_version table (id is provided in the request params)
    const bin = await getSigningUserImage(id);

    // trim the image and send it as a buffer
    return await sharp(bin).trim().toBuffer();
}

module.exports = getSignature;