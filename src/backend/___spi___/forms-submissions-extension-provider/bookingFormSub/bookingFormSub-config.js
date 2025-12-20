// bookingFormSub-config.js
import { customFormHandler } from './bookingFormSub';

// import * as formsSubmissionsExtensionProvider from 'interfaces-forms-v4-submission-extension';

/** @returns {import('interfaces-forms-v4-submission-extension').FormSubmissionSpiExtensionConfig} */
export function getConfig() {
  return {
    onFormSubmit: async (submissionData) => {
      // Call your custom function to handle form submission
      return await customFormHandler(submissionData);
    }
  };
}

// Import the custom form handler function from bookingFormSub.js
