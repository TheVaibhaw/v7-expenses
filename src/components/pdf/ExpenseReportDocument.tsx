import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExpenseLineItem, PayerDetails } from "@/lib/types";
import { APP_NAME, CURRENCY_SYMBOL } from "@/lib/constants";
import { calculateTotal, getValidLineItems } from "@/lib/validation";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #4f46e5",
    paddingBottom: 12,
    marginBottom: 20,
  },
  brand: {
    fontSize: 16,
    fontWeight: 700,
    color: "#4f46e5",
  },
  brandSub: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
    textAlign: "right",
  },
  generatedAt: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderTop: "2px solid #4f46e5",
  },
  cell: {
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
    borderRightStyle: "solid",
  },
  cellLast: {
    padding: 6,
  },
  headerCellText: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 9,
  },
  colDescription: { width: "38%" },
  colPrice: { width: "16%", textAlign: "right" },
  colMethod: { width: "18%" },
  colDate: { width: "28%" },
  totalLabel: {
    width: "82%",
    padding: 6,
    fontWeight: 700,
    textAlign: "right",
  },
  totalValue: {
    width: "18%",
    padding: 6,
    fontWeight: 700,
    textAlign: "right",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: "#4f46e5",
  },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
    borderRadius: 4,
    padding: 10,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    width: 90,
    fontWeight: 700,
    color: "#334155",
  },
  detailValue: {
    flex: 1,
    color: "#0f172a",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
});

function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL}${value.toFixed(2)}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface ExpenseReportDocumentProps {
  items: ExpenseLineItem[];
  payer: PayerDetails;
  generatedAt?: Date;
}

export function ExpenseReportDocument({ items, payer, generatedAt }: ExpenseReportDocumentProps) {
  const validItems = getValidLineItems(items);
  const total = calculateTotal(items);
  const hasPayerDetails = Boolean(payer.phone.trim() || payer.upiId.trim() || payer.notes.trim());
  const created = generatedAt ?? new Date();

  return (
    <Document title="Expense Report" author={APP_NAME}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.brandSub}>expenses.thev7ninja.in</Text>
          </View>
          <View>
            <Text style={styles.title}>Expense Report</Text>
            <Text style={styles.generatedAt}>Generated {formatDateTime(created.toISOString())}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={[styles.cell, styles.colDescription]}>
              <Text style={styles.headerCellText}>Item</Text>
            </View>
            <View style={[styles.cell, styles.colMethod]}>
              <Text style={styles.headerCellText}>Payment Method</Text>
            </View>
            <View style={[styles.cell, styles.colDate]}>
              <Text style={styles.headerCellText}>Date &amp; Time</Text>
            </View>
            <View style={[styles.cellLast, styles.colPrice]}>
              <Text style={styles.headerCellText}>Price</Text>
            </View>
          </View>

          {validItems.map((item, index) => (
            <View key={item.id} style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
              <View style={[styles.cell, styles.colDescription]}>
                <Text>{item.description}</Text>
              </View>
              <View style={[styles.cell, styles.colMethod]}>
                <Text>{item.paymentMethod}</Text>
              </View>
              <View style={[styles.cell, styles.colDate]}>
                <Text>{formatDateTime(item.purchasedAt)}</Text>
              </View>
              <View style={[styles.cellLast, styles.colPrice]}>
                <Text>{formatCurrency(Number(item.price))}</Text>
              </View>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {hasPayerDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.detailsBox}>
              {payer.phone.trim() && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{payer.phone.trim()}</Text>
                </View>
              )}
              {payer.upiId.trim() && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UPI ID</Text>
                  <Text style={styles.detailValue}>{payer.upiId.trim()}</Text>
                </View>
              )}
              {payer.notes.trim() && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{payer.notes.trim()}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Generated with {APP_NAME}</Text>
          <Text>expenses.thev7ninja.in</Text>
        </View>
      </Page>
    </Document>
  );
}
