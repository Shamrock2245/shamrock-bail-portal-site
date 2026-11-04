import React, { useEffect, useState } from "react";
import { WixDesignSystemProvider, Page, Card, Table, EmptyState, Text } from "@wix/design-system";
import '@wix/design-system/styles.global.css';
import { items } from "@wix/data";

export default function EducationComplianceDashboard() {
  const [acknowledgments, setAcknowledgments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { items: ackItems } = await items.query("education-acknowledgments").find();
        setAcknowledgments(ackItems);
      } catch (e) {
        console.error("Failed to load acknowledgments", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const columns = [
    { title: "Student Email", render: (row: any) => <Text>{row.studentEmail}</Text> },
    { title: "Signature", render: (row: any) => <Text>{row.signatureName}</Text> },
    { title: "Acknowledged", render: (row: any) => <Text>{row.acknowledged ? "Yes" : "No"}</Text> },
    { title: "Date", render: (row: any) => <Text>{new Date(row._createdDate).toLocaleDateString()}</Text> },
    { title: "IP Address", render: (row: any) => <Text>{row.ipAddress}</Text> }
  ];

  return (
    <WixDesignSystemProvider>
      <Page>
        <Page.Header
          title="Education Compliance"
          subtitle="Manage student DFS compliance requirements and attendance rosters."
          actionsBar={
            <Text>Roster export has moved to the Bail School system.</Text>
          }
        />
        <Page.Content>
          <Card>
            <Card.Header title="Student Integrity Acknowledgments" />
            <Card.Divider />
            {acknowledgments.length > 0 ? (
              <Table data={acknowledgments} columns={columns} />
            ) : (
              <EmptyState title="No Acknowledgments Yet" subtitle="Students must complete the integrity form to appear here." theme="page" />
            )}
          </Card>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
}
