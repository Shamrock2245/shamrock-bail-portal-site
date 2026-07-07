import { extensions } from "@wix/astro/builders";

export const dataExtension = extensions.genericExtension({
  compId: "17613d99-fa9d-4c68-b07f-2e6b13cd3982",
  compName: "data-extension",
  compType: "DATA_COMPONENT",
  compData: {
    dataComponent: {
      collections: [
        {
          schemaUrl: "https://www.wix.com/",
          idSuffix: "education-acknowledgments",
          displayName: "Education Acknowledgments",
          displayField: "studentEmail",
          fields: [
            { key: "studentEmail", displayName: "Student Email", type: "TEXT", required: true, unique: true },
            { key: "memberId", displayName: "Member ID", type: "TEXT", required: true },
            { key: "acknowledged", displayName: "Acknowledged", type: "BOOLEAN", required: true, defaultValue: false },
            { key: "signatureName", displayName: "Signature Name", type: "TEXT", required: true },
            { key: "ipAddress", displayName: "IP Address", type: "TEXT" }
          ],
          dataPermissions: {
            itemRead: "PRIVILEGED",
            itemInsert: "SITE_MEMBER",
            itemUpdate: "PRIVILEGED",
            itemRemove: "PRIVILEGED"
          }
        }
      ]
    }
  }
});
