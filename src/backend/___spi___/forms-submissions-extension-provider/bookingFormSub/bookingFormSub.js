// bookingFormSub.js

export async function customFormHandler(submissionData) {
    // Extract the data submitted from the form
    const { formData, formId, collectionId } = submissionData;

    // Example: Validate form data before submission
    if (!formData.email || !validateEmail(formData.email)) {
        throw new Error("Invalid email address.");
    }

    // Example: Manipulate data before it is saved
    const updatedFormData = {
        ...formData,
        processedAt: new Date(), // Add a timestamp when processing
        status: "Pending Review" // Set a default status
    };

    // Example: Perform any additional custom operations
    // For instance, sending a notification email
    await sendNotificationEmail(updatedFormData);

    // Return the updated form data to be saved in the collection
    return updatedFormData;
}

// Example helper function to validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Example helper function to send a notification email
async function sendNotificationEmail(formData) {
    // Logic to send an email notification
    console.log("Sending notification email for form submission:", formData);
}
