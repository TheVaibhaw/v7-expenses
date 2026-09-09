import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Currency, ExpenseGroup, PayerDetails, SplitConfig } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { calculateGroupTotal, calculateGrandTotal, computeSplitShare, getValidGroups, getValidLineItems } from "@/lib/validation";
import { PDF_FONT_FAMILY, registerPdfFonts } from "@/lib/pdf-fonts";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: PDF_FONT_FAMILY,
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
  groupSection: {
    marginTop: 18,
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4f46e5",
  },
  groupSubtotalLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  table: {
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
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderTop: "1px solid #c7d2fe",
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
  grandTotalSection: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderStyle: "solid",
    borderRadius: 4,
    padding: 12,
    backgroundColor: "#eef2ff",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#4f46e5",
  },
  splitBox: {
    marginTop: 10,
    borderTop: "1px solid #c7d2fe",
    paddingTop: 10,
  },
  splitTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#4f46e5",
    marginBottom: 4,
  },
  splitLine: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 2,
  },
  splitNote: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 6,
  },
  splitTable: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderStyle: "solid",
    borderRadius: 4,
    overflow: "hidden",
  },
  splitHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#4f46e5",
  },
  splitRow: {
    flexDirection: "row",
    borderTop: "1px solid #e0e7ff",
  },
  splitRowAlt: {
    flexDirection: "row",
    borderTop: "1px solid #e0e7ff",
    backgroundColor: "#f5f7ff",
  },
  splitCellName: {
    width: "50%",
    padding: 6,
  },
  splitCellAmount: {
    width: "25%",
    padding: 6,
    textAlign: "right",
  },
  splitCellNameWide: {
    width: "70%",
    padding: 6,
  },
  splitCellAmountNarrow: {
    width: "30%",
    padding: 6,
    textAlign: "right",
  },
  splitCellStatus: {
    width: "25%",
    padding: 6,
    textAlign: "right",
  },
  statusPaid: {
    color: "#059669",
    fontWeight: 700,
  },
  statusPending: {
    color: "#b45309",
    fontWeight: 700,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: "#4f46e5",
  },
  detailsBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
    borderRadius: 4,
    padding: 10,
  },
  detailsText: {
    flex: 1,
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
  qrCodeWrap: {
    marginLeft: 12,
    alignItems: "center",
  },
  qrCodeImage: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "solid",
  },
  qrCodeLabel: {
    marginTop: 4,
    fontSize: 7,
    color: "#64748b",
    textAlign: "center",
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

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toFixed(2)}`;
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
  groups: ExpenseGroup[];
  payer: PayerDetails;
  currency: Currency;
  split?: SplitConfig;
  generatedAt?: Date;
}

export function ExpenseReportDocument({ groups, payer, currency, split, generatedAt }: ExpenseReportDocumentProps) {
  const validGroups = getValidGroups(groups);
  const grandTotal = calculateGrandTotal(groups);
  const hasPayerDetails = Boolean(payer.phone.trim() || payer.upiId.trim() || payer.notes.trim() || payer.qrCodeImage);
  const created = generatedAt ?? new Date();
  const symbol = currency.symbol;

  const splitShare = split?.enabled ? computeSplitShare(grandTotal, split.people) : null;
  const showSplitStatus = Boolean(splitShare?.shares.some((share) => share.isSelf));

  return (
    <Document title="Expense Report" author={APP_NAME}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.brandSub}>expenses.thev7ninja.in</Text>
          </View>
          <View>
            <Text style={styles.title}>Expense Report</Text>
            <Text style={styles.generatedAt}>Generated {formatDateTime(created.toISOString())}</Text>
          </View>
        </View>

        {validGroups.map((group) => {
          const validItems = getValidLineItems(group.items);
          const groupTotal = calculateGroupTotal(group);
          return (
            <View key={group.id} style={styles.groupSection} wrap={false}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <Text style={styles.groupSubtotalLabel}>
                  {validItems.length} item{validItems.length === 1 ? "" : "s"}
                </Text>
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
                      <Text>{formatCurrency(Number(item.price), symbol)}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.subtotalRow}>
                  <Text style={styles.totalLabel}>Subtotal - {group.name}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(groupTotal, symbol)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.grandTotalSection} wrap={false}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total ({validGroups.length} group{validGroups.length === 1 ? "" : "s"})</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal, symbol)}</Text>
          </View>

          {splitShare && (
            <View style={styles.splitBox}>
              <Text style={styles.splitTitle}>
                Split Summary &middot; {formatCurrency(splitShare.total, symbol)} &middot; {splitShare.people} people
              </Text>

              <View style={styles.splitTable}>
                <View style={styles.splitHeaderRow}>
                  <View style={showSplitStatus ? styles.splitCellName : styles.splitCellNameWide}>
                    <Text style={styles.headerCellText}>Person</Text>
                  </View>
                  <View style={showSplitStatus ? styles.splitCellAmount : styles.splitCellAmountNarrow}>
                    <Text style={styles.headerCellText}>Amount owed</Text>
                  </View>
                  {showSplitStatus && (
                    <View style={styles.splitCellStatus}>
                      <Text style={styles.headerCellText}>Status</Text>
                    </View>
                  )}
                </View>
                {splitShare.shares.map((share, index) => (
                  <View key={share.id} style={index % 2 === 1 ? styles.splitRowAlt : styles.splitRow}>
                    <View style={showSplitStatus ? styles.splitCellName : styles.splitCellNameWide}>
                      <Text>{share.name}{share.isSelf ? " (me)" : ""}</Text>
                    </View>
                    <View style={showSplitStatus ? styles.splitCellAmount : styles.splitCellAmountNarrow}>
                      <Text>{formatCurrency(share.amount, symbol)}</Text>
                    </View>
                    {showSplitStatus && (
                      <View style={styles.splitCellStatus}>
                        <Text style={share.isSelf ? styles.statusPaid : styles.statusPending}>
                          {share.isSelf ? "Paid" : "Pending"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {showSplitStatus && (
                <Text style={styles.splitNote}>
                  {splitShare.shares.find((s) => s.isSelf)?.name} already paid the full amount - everyone else still
                  owes their share above.
                </Text>
              )}

              {splitShare.extraCount > 0 && (
                <Text style={styles.splitNote}>
                  The total doesn&apos;t divide evenly, so {splitShare.extraCount}{" "}
                  {splitShare.extraCount === 1 ? "person pays" : "people pay"} one paisa/cent more than the rest -
                  shares always sum exactly to the total.
                </Text>
              )}
            </View>
          )}
        </View>

        {hasPayerDetails && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.detailsBox}>
              <View style={styles.detailsText}>
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
              {payer.qrCodeImage && (
                <View style={styles.qrCodeWrap}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF-drawing primitive, not an HTML <img>; it has no alt prop */}
                  <Image src={payer.qrCodeImage} style={styles.qrCodeImage} />
                  <Text style={styles.qrCodeLabel}>Scan to pay</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Generated with {APP_NAME}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
