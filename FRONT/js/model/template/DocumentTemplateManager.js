/**
 * @class DocumentTemplateManager - This class is responsible for managing the document template
 */
class DocumentTemplateManager extends TemplateManager {

    /**
     * Constructor of the SignedUserTemplateManager
     * @param {HTMLElement} container Container of the template manager
     */
    constructor(container = null) {
        super(container);
        this.path = 'visual/templates/DocumentTemplate.html';
    }


    /**
     * Sets the same height for all document titles within the container.
     */
    #setSameHeight() {
        let maxSize = 0;

        this.container.querySelectorAll('.document-title').forEach((doc) => {
            maxSize = Math.max(maxSize, doc.offsetHeight);
        });

        this.container.querySelectorAll('.document-title').forEach((doc) => {
            doc.style.height = maxSize + 'px';
        });

    }

    /**
     * Adds multiple documents to the container.
     * @param {Array} documents - The array of documents to be added.
     * @returns {Promise} A promise that resolves when all documents have been added.
     */
    async addDocuments(documents = []) {
        // add the documents to the container
        for (let doc of documents) {
            await this.#addDocument(doc);
        }

        this.#setSameHeight();
    }

    /**
     * Add a PoDocument to the container
     * @param {PoDocument} document Document to be added to the container
     * @returns Promise<void>
     */
    async #addDocument(document) {
        // values is a map that contains the values to be replaced in the template, 
        // the key is the name of the variable in the template and the value is the value to replace
        let values = [];

        // check if the passed parameter is a Document object
        if (document instanceof PoDocument) {
            values['id'] = document.getId();
            values['Title'] = document.getFileName();
            const lastVer = document.getLastVersion();

            // check if the last version exsists and is a Version object
            if (!lastVer || !(lastVer instanceof Version)) {
                // if this warning is raised, it means that the document has no version (or that it's not recognized as a version object)
                // ==> check if the version data are received correctly from the server
                // ==> check if the fields names are the same as in the constructor
                // ==> check if the version data are added to the database, if not, verify the server side code
                console.warn(`No version found for the document ${document.getFileName()}!`);
                return;
            }

            values['Date'] = lastVer.getAddDate();
            values['Preview'] = lastVer.getPreview();
        }

        // call parent method to add the document to the container
        await super.addTemplate(values);
    }

    onDocumentClicked(callback) {
        super.onClick(callback, '', 'document', '#mainBody');
    }
}