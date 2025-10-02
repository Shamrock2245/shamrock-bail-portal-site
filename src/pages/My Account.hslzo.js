// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Import necessary UI components from Wix UI library
import { Card, Box, TabsItem, Tabs, Text, TextInput, Dropdown, Checkbox, Button } from 'wix-ui-tpa/dist/src/components';

import { saveUserLocation } from 'backend/location';

$w.onReady(function ( ) {

    const FormField = ({ id, label, type = "text", placeholder, options, onChange }) => {
        switch(type) {
            case "select":
                return (
                    <Box marginBottom={3}>
                        <Text>{label}</Text>
                        <Dropdown
                            placeholder={placeholder}
                            options={options.map(option => ({ value: option, label: option }))}
                            onChange={(option) => onChange(id, option.value)}
                        />
                    </Box>
                );
            case "checkbox":
                return (
                    <Box marginBottom={3}>
                        <Checkbox label={label} onChange={(e) => onChange(id, e.checked)} />
                    </Box>
                );
            default:
                return (
                    <Box marginBottom={3}>
                        <Text>{label}</Text>
                        <TextInput placeholder={placeholder} onChange={(e) => onChange(id, e.target.value)} />
                    </Box>
                );
        }
    };

    const ConditionalFields = ({ condition, fields, formData, setFormData }) => {
        const [show, setShow] = useState(false);
        return (
            <Box>
                <Checkbox label={condition} onChange={(e) => setShow(e.checked)} />
                {show && fields.map((field, index) => (
                    <FormField 
                        key={index} 
                        {...field} 
                        onChange={(id, value) => setFormData({...formData, [id]: value})}
                    />
                ))}
            </Box>
        );
    };

    const PersonForm = ({ role, formData, setFormData }) => {
        const commonFields = [
            { id: `${role}-name`, label: "Full Name", placeholder: "Enter full name" },
            { id: `${role}-email`, label: "Email", type: "email", placeholder: "Enter email address" },
            { id: `${role}-phone`, label: "Phone", type: "tel", placeholder: "Enter phone number" },
            { id: `${role}-address`, label: "Address", placeholder: "Enter full address" },
            { id: `${role}-city`, label: "City", placeholder: "Enter city" },
            { id: `${role}-state`, label: "State", placeholder: "Enter state" },
            { id: `${role}-zip`, label: "ZIP", placeholder: "Enter ZIP code" },
            { id: `${role}-dob`, label: "Date of Birth", type: "date", placeholder: "Enter date of birth" },
            { id: `${role}-ssn`, label: "Social Security Number", placeholder: "Enter SSN" },
            { id: `${role}-height`, label: "Height", placeholder: "Enter height" },
            { id: `${role}-weight`, label: "Weight", placeholder: "Enter weight" },
            { id: `${role}-eyes`, label: "Eye Color", placeholder: "Enter eye color" },
            { id: `${role}-hair`, label: "Hair Color", placeholder: "Enter hair color" },
            { id: `${role}-race`, label: "Race", placeholder: "Enter race" },
            { id: `${role}-handedness`, label: "Handedness", type: "select", placeholder: "Select handedness", options: ["Left Handed", "Right Handed"] },
        ];

        const additionalFields = [
            { id: `${role}-glasses`, label: "Wears Glasses", type: "checkbox" },
            { id: `${role}-dentures`, label: "Wears Dentures", type: "checkbox" },
            { id: `${role}-facial-hair`, label: "Has Beard/Mustache", type: "checkbox" },
            { id: `${role}-tattoos`, label: "Identification Marks or Tattoos", placeholder: "Describe any marks or tattoos" },
            { id: `${role}-arrested-before`, label: "Arrested Before", type: "checkbox" },
            { id: `${role}-convicted-offense`, label: "Convicted Offense", placeholder: "Enter convicted offense if applicable" },
        ];

        const spouseFields = [
            { id: `${role}-spouse-name`, label: "Spouse's Name", placeholder: "Enter spouse's name" },
            { id: `${role}-spouse-dob`, label: "Spouse's Date of Birth", type: "date", placeholder: "Enter spouse's date of birth" },
            { id: `${role}-spouse-email`, label: "Spouse's Email", type: "email", placeholder: "Enter spouse's email" },
        ];

        const employmentFields = [
            { id: `${role}-employer`, label: "Employer", placeholder: "Enter employer name" },
            { id: `${role}-employer-address`, label: "Employer Address", placeholder: "Enter employer address" },
            { id: `${role}-employer-phone`, label: "Employer Phone", type: "tel", placeholder: "Enter employer phone" },
            { id: `${role}-employment-length`, label: "Length of Employment", placeholder: "Enter length of employment" },
        ];

        const vehicleFields = [
            { id: `${role}-vehicle-year`, label: "Vehicle Year", placeholder: "Enter vehicle year" },
            { id: `${role}-vehicle-make`, label: "Vehicle Make", placeholder: "Enter vehicle make" },
            { id: `${role}-vehicle-model`, label: "Vehicle Model", placeholder: "Enter vehicle model" },
            { id: `${role}-vehicle-color`, label: "Vehicle Color", placeholder: "Enter vehicle color" },
            { id: `${role}-vehicle-license`, label: "Vehicle License Number", placeholder: "Enter vehicle license number" },
        ];

        return (
            <Card>
                <Box padding={3}>
                    <Text tagName="h2">{role.charAt(0).toUpperCase() + role.slice(1)} Information</Text>
                    <FormField 
                        id={`${role}-bond-amount`} 
                        label="Bond Amount" 
                        type="number" 
                        placeholder="Enter bond amount" 
                        onChange={(id, value) => setFormData({...formData, [id]: value})}
                    />
                    {commonFields.concat(additionalFields).map((field, index) => (
                        <FormField 
                            key={index} 
                            {...field} 
                            onChange={(id, value) => setFormData({...formData, [id]: value})}
                        />
                    ))}
                    <ConditionalFields condition="Has Spouse" fields={spouseFields} formData={formData} setFormData={setFormData} />
                    <ConditionalFields condition="Is Employed" fields={employmentFields} formData={formData} setFormData={setFormData} />
                    <ConditionalFields condition="Has Vehicle" fields={vehicleFields} formData={formData} setFormData={setFormData} />
                </Box>
            </Card>
        );
    };

    const AgentForm = ({ formData, setFormData }) => {
        const fields = [
            { id: "agent-name", label: "Agent Name", placeholder: "Enter agent name" },
            { id: "agent-id", label: "Agent ID", placeholder: "Enter agent ID" },
            { id: "power-no", label: "Power No.", placeholder: "Enter power number" },
            { id: "case-no", label: "Case No.", placeholder: "Enter case number" },
            { id: "execution-date", label: "Execution Date", type: "date", placeholder: "Enter execution date" },
            { id: "bond-amount", label: "Bond Amount", type: "number", placeholder: "Enter bond amount" },
        ];

        return (
            <Card>
                <Box padding={3}>
                    <Text tagName="h2">Agent Information</Text>
                    {fields.map((field, index) => (
                        <FormField 
                            key={index} 
                            {...field} 
                            onChange={(id, value) => setFormData({...formData, [id]: value})}
                        />
                    ))}
                </Box>
            </Card>
        );
    };

    const Dashboard = () => {
        const [showSecondIndemnitor, setShowSecondIndemnitor] = useState(false);
        const [formData, setFormData] = useState({});

        const handleSubmit = async () => {
            try {
                const response = await fetch('https://www.yourdomain.com/_functions/submitBailBondApplication', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData ),
                });
                
                if (response.ok) {
                    const pdfUrl = await response.text();
                    window.open(pdfUrl, '_blank');
                } else {
                    console.error('Error submitting form');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        return (
            <Box backgroundColor="grey" padding={4}>
                <Text tagName="h1">Bail Bond Application Dashboard</Text>
                <Tabs>
                    <TabsItem label="Defendant">
                        <PersonForm role="defendant" formData={formData} setFormData={setFormData} />
                    </TabsItem>
                    <TabsItem label="Indemnitor 1">
                        <PersonForm role="indemnitor1" formData={formData} setFormData={setFormData} />
                    </TabsItem>
                    <TabsItem label="Indemnitor 2">
                        {showSecondIndemnitor ? (
                            <PersonForm role="indemnitor2" formData={formData} setFormData={setFormData} />
                        ) : (
                            <Button onClick={() => setShowSecondIndemnitor(true)}>Add Second Indemnitor</Button>
                        )}
                    </TabsItem>
                    <TabsItem label="Agent">
                        <AgentForm formData={formData} setFormData={setFormData} />
                    </TabsItem>
                </Tabs>
                <Button onClick={handleSubmit}>Submit Application</Button>
            </Box>
        );
    };

    class BailBondDashboard extends HTMLElement {
        connectedCallback() {
            const root = createRoot(this);
            root.render(createElement(Dashboard));
        }
    }

    customElements.define('bail-bond-dashboard', BailBondDashboard);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Call the backend function to save the location
            saveUserLocation(latitude, longitude)
                .then((result) => {
                    if (result.success) {
                        console.log(result.message);
                    } else {
                        console.error("Failed to save location:", result.message);
                    }
                })
                .catch((error) => {
                    console.error("Error calling backend function:", error);
                });
        }, (error) => {
            console.error(`Geolocation error (${error.code}): ${error.message}`);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
});
