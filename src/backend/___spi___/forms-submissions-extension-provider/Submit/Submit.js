import * as formsSubmissionsExtensionProvider from 'interfaces-forms-v4-submission-extension';

/**
 * > **Note:** The Form Submission service plugin only works with the Wix Forms app. Call [GetAppInstance](https://dev.wix.com/docs/rest/api-reference/app-management/apps/app-instance/get-app-instance) to confirm that the app named `wix_forms` is installed on the site.
 * <br>
 * Validates a submission. <br>
 * Validates a site visitor's form submission and returns any validation violations. <br>
 * Site visitors can see the validation violations on their forms. For example, invalid fields are highlighted in red.
 * @param {import('interfaces-forms-v4-submission-extension').ValidateSubmissionOptions} options
 * @param {import('interfaces-forms-v4-submission-extension').Context} context
 * @returns {Promise<import('interfaces-forms-v4-submission-extension').ValidateSubmissionResponse | import('interfaces-forms-v4-submission-extension').BusinessError>}
 */
export const validateSubmission = async (options, context) => {};
